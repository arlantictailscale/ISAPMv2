"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function adminCancelOrder(orderId: string) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Admin access required" }
  }

  // Get the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_payments(*)")
    .eq("id", orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: "Order not found" }
  }

  // Check if order is already cancelled
  if (order.status === "cancelled") {
    return { success: false, error: "Order is already cancelled" }
  }

  // Check if payment has been verified - don't cancel verified orders
  const hasVerifiedPayment = order.order_payments?.some(
    (p: any) => p.payment_status === "verified"
  )
  if (hasVerifiedPayment) {
    return { success: false, error: "Cannot cancel order with verified payment" }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    return { success: false, error: "Server configuration error" }
  }

  try {
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Update order status to cancelled
    const { error: updateError } = await serviceClient
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      return { success: false, error: `Failed to cancel order: ${updateError.message}` }
    }

    // Revalidate paths
    revalidatePath("/admin/payment-validation")
    revalidatePath("/my-purchases")

    return { success: true }
  } catch (error: any) {
    return { success: false, error: `Failed to cancel order: ${error.message || "Unknown error"}` }
  }
}
