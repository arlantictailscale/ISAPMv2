"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if the order belongs to the user
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_payments(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  if (orderError || !order) {
    return { success: false, error: "Order not found" }
  }

  // Check if payment has been submitted
  if (order.order_payments && order.order_payments.length > 0) {
    return { success: false, error: "Cannot cancel order with submitted payment" }
  }

  // Update order status to cancelled
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("[v0] Error cancelling order:", updateError)
    return { success: false, error: "Failed to cancel order" }
  }

  // Revalidate the my-purchases page
  revalidatePath("/my-purchases")

  return { success: true }
}
