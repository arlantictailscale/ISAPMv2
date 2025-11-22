"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function approvePayment(paymentId: string, orderId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Update payment status to verified
    const { error: paymentError } = await supabase
      .from("order_payments")
      .update({
        payment_status: "verified",
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        rejection_reason: null,
      })
      .eq("id", paymentId)

    if (paymentError) {
      console.error("[v0] Error approving payment:", paymentError)
      return { success: false, error: "Failed to approve payment" }
    }

    // Update order status to paid
    const { error: orderError } = await supabase.from("orders").update({ status: "paid" }).eq("id", orderId)

    if (orderError) {
      console.error("[v0] Error updating order status:", orderError)
    }

    revalidatePath("/admin/payment-validation")
    return { success: true }
  } catch (error) {
    console.error("[v0] Approve payment error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function rejectPayment(paymentId: string, rejectionReason: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Update payment status to rejected
    const { error } = await supabase
      .from("order_payments")
      .update({
        payment_status: "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", paymentId)

    if (error) {
      console.error("[v0] Error rejecting payment:", error)
      return { success: false, error: "Failed to reject payment" }
    }

    revalidatePath("/admin/payment-validation")
    return { success: true }
  } catch (error) {
    console.error("[v0] Reject payment error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
