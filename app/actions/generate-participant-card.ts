"use server"

import { createClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

interface OrderItem {
  id: string
  event_id: string
  event_label: string
  participant_type: string
  participant_type_label: string
  item_type: string
}

interface GenerateCardResult {
  success: boolean
  cardId?: string
  cardNumber?: string
  error?: string
}

/**
 * Generate a unique card number in format: ISAPM-XXXX-XXXX
 */
function generateCardNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding similar-looking characters
  let part1 = ""
  let part2 = ""
  
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `ISAPM-${part1}-${part2}`
}

/**
 * Generate a participant card for a verified order
 * This function is called automatically when a payment is verified
 */
export async function generateParticipantCard(orderId: string): Promise<GenerateCardResult> {
  try {
    const supabase = await createClient()

    // Check if card already exists for this order
    const { data: existingCard } = await supabase
      .from("participant_cards")
      .select("id, card_number")
      .eq("order_id", orderId)
      .single()

    if (existingCard) {
      console.log("[v0] Participant card already exists for order:", orderId)
      return {
        success: true,
        cardId: existingCard.id,
        cardNumber: existingCard.card_number,
      }
    }

    // Fetch order with items and user profile
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        full_name,
        email,
        phone,
        institution,
        status,
        order_items (
          id,
          event_id,
          event_label,
          participant_type,
          participant_type_label,
          item_type
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("[v0] Error fetching order for card generation:", orderError)
      return { success: false, error: "Order not found" }
    }

    // Verify order is paid
    if (order.status !== "paid") {
      console.log("[v0] Order not paid, skipping card generation:", orderId)
      return { success: false, error: "Order not paid" }
    }

    // Get user profile for position
    const { data: profile } = await supabase
      .from("profiles")
      .select("position")
      .eq("id", order.user_id)
      .single()

    // Extract event registrations (only event items, not accommodation etc.)
    const eventItems = (order.order_items as OrderItem[]).filter(
      (item) => item.item_type === "event"
    )

    if (eventItems.length === 0) {
      console.log("[v0] No event items in order, skipping card generation:", orderId)
      return { success: false, error: "No event registrations in order" }
    }

    const events = eventItems.map((item) => ({
      event_id: item.event_id,
      event_label: item.event_label,
      participant_type: item.participant_type,
      participant_type_label: item.participant_type_label,
    }))

    // Generate unique card number and secure token
    let cardNumber = generateCardNumber()
    const secureToken = uuidv4()

    // Ensure card number is unique (retry if collision)
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("participant_cards")
        .select("id")
        .eq("card_number", cardNumber)
        .single()

      if (!existing) break
      cardNumber = generateCardNumber()
      attempts++
    }

    // Create participant card
    const { data: card, error: insertError } = await supabase
      .from("participant_cards")
      .insert({
        card_number: cardNumber,
        secure_token: secureToken,
        user_id: order.user_id,
        order_id: orderId,
        full_name: order.full_name,
        email: order.email,
        phone: order.phone,
        institution: order.institution,
        position: profile?.position || null,
        events: events,
        status: "active",
        issued_at: new Date().toISOString(),
      })
      .select("id, card_number")
      .single()

    if (insertError) {
      console.error("[v0] Error creating participant card:", insertError)
      return { success: false, error: "Failed to create participant card" }
    }

    console.log("[v0] Participant card created successfully:", card.card_number, "for order:", orderId)

    return {
      success: true,
      cardId: card.id,
      cardNumber: card.card_number,
    }
  } catch (error) {
    console.error("[v0] Generate participant card error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Revoke a participant card (e.g., when order is cancelled/refunded)
 */
export async function revokeParticipantCard(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("participant_cards")
      .update({ status: "revoked" })
      .eq("order_id", orderId)

    if (error) {
      console.error("[v0] Error revoking participant card:", error)
      return { success: false, error: "Failed to revoke card" }
    }

    console.log("[v0] Participant card revoked for order:", orderId)
    return { success: true }
  } catch (error) {
    console.error("[v0] Revoke participant card error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
