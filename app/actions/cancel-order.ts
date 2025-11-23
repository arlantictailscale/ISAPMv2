"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function cancelOrder(orderId: string) {
  console.log("[v0] cancelOrder action called for order:", orderId)

  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Current user:", user?.id)

  if (!user) {
    console.error("[v0] No user found - unauthorized")
    return { success: false, error: "Unauthorized" }
  }

  // Check if the order belongs to the user
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_payments(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  console.log("[v0] Order fetch result:", { order: order?.id, error: orderError })

  if (orderError || !order) {
    console.error("[v0] Order not found:", orderError)
    return { success: false, error: "Order not found" }
  }

  console.log("[v0] Order payments:", order.order_payments)
  console.log("[v0] Has payments:", order.order_payments && order.order_payments.length > 0)

  // Check if payment has been submitted
  if (order.order_payments && order.order_payments.length > 0) {
    console.error("[v0] Cannot cancel - payment already submitted")
    return { success: false, error: "Cannot cancel order with submitted payment" }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[v0] Missing Supabase credentials:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    })
    return { success: false, error: "Configuration error" }
  }

  const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log("[v0] Updating order status to cancelled")
  const { data: updateData, error: updateError } = await serviceClient
    .from("orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .select()

  console.log("[v0] Update result:", { data: updateData, error: updateError })

  if (updateError) {
    console.error("[v0] Error cancelling order:", updateError)
    return { success: false, error: "Failed to cancel order" }
  }

  if (!updateData || updateData.length === 0) {
    console.error("[v0] No rows updated - order may not exist or user mismatch")
    return { success: false, error: "Failed to update order" }
  }

  console.log("[v0] Order cancelled successfully, revalidating path")
  // Revalidate the my-purchases page
  revalidatePath("/my-purchases")

  return { success: true }
}
