"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { checkProfileCompleteness } from "@/lib/profile/validation"

/**
 * Create order from cart and proceed to checkout
 */
export async function createOrderFromCart(guestInfo: {
  full_name: string
  email: string
  phone: string
  institution: string
  position: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const profileStatus = checkProfileCompleteness(profile)

  if (!profileStatus.isComplete) {
    return {
      error: `Profile incomplete. Please complete these fields: ${profileStatus.missingFields.join(", ")}`,
    }
  }

  // Get active cart with items
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("*, cart_items(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (cartError || !cart) {
    return { error: "Cart not found" }
  }

  const items = cart.cart_items || []
  if (items.length === 0) {
    return { error: "Cart is empty" }
  }

  const totalAmount = items.reduce((sum, item) => {
    const nights = item.nights || 1
    return sum + (item.unit_price || 0) * nights
  }, 0)
  const currency = items[0].currency

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      full_name: guestInfo.full_name,
      email: guestInfo.email,
      phone: guestInfo.phone,
      institution: guestInfo.institution,
      position: guestInfo.position,
      status: "pending",
      total_amount: totalAmount,
      currency: currency,
    })
    .select()
    .single()

  if (orderError) {
    console.error("[v0] Error creating order:", orderError)
    return { error: orderError.message }
  }

  // Move cart items to order items
  const orderItemsData = items.map((item) => ({
    order_id: order.id,
    item_type: item.item_type,
    event_id: item.event_id,
    event_label: item.event_label,
    participant_type_id: item.participant_type_id,
    participant_type_label: item.participant_type_label,
    hotel_room_type: item.hotel_room_type,
    check_in_date: item.check_in_date,
    check_out_date: item.check_out_date,
    nights: item.nights,
    unit_price: item.unit_price,
    currency: item.currency,
  }))

  const { error: orderItemsError } = await supabase.from("order_items").insert(orderItemsData)

  if (orderItemsError) {
    console.error("[v0] Error creating order items:", orderItemsError)
    // Rollback order
    await supabase.from("orders").delete().eq("id", order.id)
    return { error: orderItemsError.message }
  }

  const { error: deleteError } = await supabase.from("cart_items").delete().eq("cart_id", cart.id)

  if (deleteError) {
    console.error("[v0] Error deleting cart items:", deleteError)
  }

  const { error: updateError } = await supabase.from("carts").update({ status: "checked_out" }).eq("id", cart.id)

  if (updateError) {
    console.error("[v0] Error updating cart status:", updateError)
  }

  try {
    await sendOrderConfirmationEmail({
      email: guestInfo.email,
      userName: guestInfo.full_name,
      orderId: order.id,
      orderItems: orderItemsData,
      totalAmount: totalAmount,
      currency: currency,
    })
    console.log("[v0] Order confirmation email sent to:", guestInfo.email)
  } catch (emailError) {
    // Log error but don't fail the order creation
    console.error("[v0] Failed to send order confirmation email:", emailError)
  }

  revalidatePath("/cart")
  revalidatePath("/checkout")
  revalidatePath("/", "layout")

  return { data: order }
}
