"use server"

import { createClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

interface OrderItem {
  id: string
  event_id: string
  event_label: string
  participant_type_id: string
  participant_type_label: string
  item_type: string
}

interface GenerateCardResult {
  success: boolean
  cardId?: string
  cardToken?: string
  error?: string
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
      .select("id, card_token")
      .eq("order_id", orderId)
      .single()

    if (existingCard) {
      console.log("[v0] Participant card already exists for order:", orderId)
      return {
        success: true,
        cardId: existingCard.id,
        cardToken: existingCard.card_token,
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
        institution,
        status,
        order_items (
          id,
          event_id,
          event_label,
          participant_type_id,
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
      .select("position, institution")
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
      participant_type: item.participant_type_id,
      participant_type_label: item.participant_type_label,
    }))

    // Generate unique card token (UUID)
    const cardToken = uuidv4()

    // Create participant card with correct schema
    const { data: card, error: insertError } = await supabase
      .from("participant_cards")
      .insert({
        card_token: cardToken,
        user_id: order.user_id,
        order_id: orderId,
        full_name: order.full_name,
        email: order.email,
        institution: order.institution || profile?.institution || null,
        position: profile?.position || null,
        events: events,
        is_checked_in: false,
        issued_at: new Date().toISOString(),
      })
      .select("id, card_token")
      .single()

    if (insertError) {
      console.error("[v0] Error creating participant card:", insertError)
      return { success: false, error: "Failed to create participant card" }
    }

    console.log("[v0] Participant card created successfully:", card.card_token.substring(0, 8), "for order:", orderId)

    return {
      success: true,
      cardId: card.id,
      cardToken: card.card_token,
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

    // For revocation, we delete the card since the schema doesn't have a status field
    const { error } = await supabase
      .from("participant_cards")
      .delete()
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

/**
 * Backfill participant cards for all verified orders that don't have cards yet
 */
export async function backfillParticipantCards(): Promise<{ success: boolean; created: number; errors: string[] }> {
  try {
    const supabase = await createClient()
    
    // Find all verified orders without participant cards
    const { data: ordersWithoutCards, error: fetchError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        full_name,
        email,
        institution,
        status,
        order_items!inner (
          id,
          event_id,
          event_label,
          participant_type_id,
          participant_type_label,
          item_type
        ),
        order_payments!inner (
          payment_status
        )
      `)
      .eq("status", "paid")
      .eq("order_payments.payment_status", "verified")

    if (fetchError) {
      console.error("[v0] Error fetching orders for backfill:", fetchError)
      return { success: false, created: 0, errors: [fetchError.message] }
    }

    if (!ordersWithoutCards || ordersWithoutCards.length === 0) {
      return { success: true, created: 0, errors: [] }
    }

    // Check which orders already have cards
    const orderIds = ordersWithoutCards.map(o => o.id)
    const { data: existingCards } = await supabase
      .from("participant_cards")
      .select("order_id")
      .in("order_id", orderIds)

    const existingOrderIds = new Set(existingCards?.map(c => c.order_id) || [])
    const ordersNeedingCards = ordersWithoutCards.filter(o => !existingOrderIds.has(o.id))

    console.log(`[v0] Found ${ordersNeedingCards.length} orders needing participant cards`)

    let created = 0
    const errors: string[] = []

    for (const order of ordersNeedingCards) {
      const result = await generateParticipantCard(order.id)
      if (result.success) {
        created++
      } else {
        errors.push(`Order ${order.id}: ${result.error}`)
      }
    }

    console.log(`[v0] Backfill complete: ${created} cards created, ${errors.length} errors`)
    return { success: true, created, errors }
  } catch (error) {
    console.error("[v0] Backfill participant cards error:", error)
    return { success: false, created: 0, errors: ["An unexpected error occurred"] }
  }
}
