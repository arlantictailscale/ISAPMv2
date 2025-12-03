"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendPaymentVerificationEmail } from "@/lib/email"
import { sendInvoiceEmail } from "@/lib/email-invoice"

export async function approvePayment(paymentId: string, orderId: string, calculatedTotal?: number) {
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

    const { data: payment, error: paymentFetchError } = await supabase
      .from("order_payments")
      .select("*, orders(*, order_items(*))")
      .eq("id", paymentId)
      .single()

    if (paymentFetchError || !payment) {
      console.error("[v0] Error fetching payment:", paymentFetchError)
      return { success: false, error: "Payment not found" }
    }

    const verifiedAt = new Date().toISOString()

    const { error: paymentError } = await supabase
      .from("order_payments")
      .update({
        payment_status: "verified",
        verified_at: verifiedAt,
        verified_by: user.id,
        rejection_reason: null,
        // Update amount to calculated total if provided (fixes incorrect amounts)
        ...(calculatedTotal !== undefined && { amount: calculatedTotal }),
      })
      .eq("id", paymentId)

    if (paymentError) {
      console.error("[v0] Error approving payment:", paymentError)
      return { success: false, error: "Failed to approve payment" }
    }

    const orderUpdateData: any = { status: "paid" }
    if (calculatedTotal !== undefined) {
      orderUpdateData.total_amount = calculatedTotal
      console.log("[v0] Updating order total_amount to calculated value:", calculatedTotal)
    }

    const { error: orderError } = await supabase.from("orders").update(orderUpdateData).eq("id", orderId)

    if (orderError) {
      console.error("[v0] Error updating order status:", orderError)
    }

    // Send payment verification email
    try {
      const order = payment.orders as any
      const emailTotalAmount = calculatedTotal !== undefined ? calculatedTotal : order.total_amount

      await sendPaymentVerificationEmail({
        email: order.email,
        userName: order.full_name,
        status: "verified",
        orderId: order.id,
        orderItems: order.order_items,
        totalAmount: emailTotalAmount,
        currency: order.currency,
      })
      console.log("[v0] Payment verification email sent to:", order.email)
    } catch (emailError) {
      console.error("[v0] Failed to send payment verification email:", emailError)
    }

    try {
      const order = payment.orders as any
      const emailTotalAmount = calculatedTotal !== undefined ? calculatedTotal : order.total_amount

      await sendInvoiceEmail({
        email: order.email,
        userName: order.full_name,
        orderId: order.id,
        orderItems: order.order_items,
        totalAmount: emailTotalAmount,
        currency: order.currency,
        customerInstitution: order.institution,
        customerPhone: order.phone,
        paymentVerifiedAt: new Date(verifiedAt),
      })
      console.log("[v0] Invoice email sent to:", order.email)
    } catch (invoiceError) {
      console.error("[v0] Failed to send invoice email:", invoiceError)
      // Don't fail the approval if invoice email fails
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

    const { data: payment, error: paymentFetchError } = await supabase
      .from("order_payments")
      .select("*, orders(*)")
      .eq("id", paymentId)
      .single()

    if (paymentFetchError || !payment) {
      console.error("[v0] Error fetching payment:", paymentFetchError)
      return { success: false, error: "Payment not found" }
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

    try {
      const order = payment.orders as any
      await sendPaymentVerificationEmail({
        email: order.email,
        userName: order.full_name,
        status: "rejected",
        rejectionReason: rejectionReason,
        orderId: order.id,
        totalAmount: order.total_amount,
        currency: order.currency,
      })
      console.log("[v0] Payment rejection email sent to:", order.email)
    } catch (emailError) {
      console.error("[v0] Failed to send payment rejection email:", emailError)
    }

    revalidatePath("/admin/payment-validation")
    return { success: true }
  } catch (error) {
    console.error("[v0] Reject payment error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
