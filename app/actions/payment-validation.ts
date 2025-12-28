"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendPaymentVerificationEmail, sendPaymentConfirmationWithInvoice } from "@/lib/email"
import { generateSequentialInvoiceNumber } from "@/lib/invoice/invoice-number"
import { grantSymposiumWebinarAccess, orderContainsSymposium } from "@/app/actions/webinar-access"
import { invalidateWebinarAccessCache, invalidateUserOrdersCache, invalidateRoomAvailabilityCache } from "@/lib/cache"

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

    const verifiedAt = new Date()

    const invoiceNumber = await generateSequentialInvoiceNumber(verifiedAt)
    console.log("[v0] Generated invoice number:", invoiceNumber)

    const { error: paymentError } = await supabase
      .from("order_payments")
      .update({
        payment_status: "verified",
        verified_at: verifiedAt.toISOString(),
        verified_by: user.id,
        rejection_reason: null,
        invoice_number: invoiceNumber,
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

    const order = payment.orders as any
    try {
      const hasSymposium = await orderContainsSymposium(orderId)
      if (hasSymposium) {
        console.log("[v0] Order contains Symposium event, granting bonus webinar access...")
        const grantResult = await grantSymposiumWebinarAccess(order.user_id, orderId, user.id)
        if (grantResult.success) {
          console.log(`[v0] Successfully granted ${grantResult.granted} bonus webinars for Symposium purchase`)
        } else {
          console.error("[v0] Failed to grant bonus webinars:", grantResult.error)
        }
      }
    } catch (grantError) {
      console.error("[v0] Error checking/granting symposium webinar access:", grantError)
      // Don't fail the payment approval if webinar grant fails
    }

    try {
      const emailTotalAmount = calculatedTotal !== undefined ? calculatedTotal : order.total_amount

      await sendPaymentConfirmationWithInvoice({
        email: order.email,
        userName: order.full_name,
        orderId: order.id,
        orderItems: order.order_items,
        totalAmount: emailTotalAmount,
        currency: order.currency,
        customerInstitution: order.institution,
        customerPhone: order.phone,
        paymentVerifiedAt: verifiedAt,
        invoiceNumber,
        paymentMethod: payment.payment_method,
      })
      console.log("[v0] Payment confirmation with invoice email sent to:", order.email)
    } catch (emailError) {
      console.error("[v0] Failed to send payment confirmation email:", emailError)
      // Don't fail the approval if email fails
    }

    await Promise.all([
      invalidateWebinarAccessCache(order.user_id),
      invalidateUserOrdersCache(order.user_id),
      invalidateRoomAvailabilityCache(),
    ])

    revalidatePath("/admin/payment-validation")
    revalidatePath("/my-webinars")
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

    const isSponsored = payment.payment_method?.toLowerCase() === "sponsored"

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
        paymentMethod: payment.payment_method,
        sponsorName: payment.sponsor_name,
      })
      console.log("[v0] Payment rejection email sent to:", order.email, "isSponsored:", isSponsored)
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
