"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function adminRemoveOrderItem(orderId: string, itemId: string) {
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

  // Get the order with its items
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*), order_payments(*)")
    .eq("id", orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: "Order not found" }
  }

  // Check if order is cancelled
  if (order.status === "cancelled") {
    return { success: false, error: "Cannot modify a cancelled order" }
  }

  // Find the item to remove
  const itemToRemove = order.order_items?.find((item: any) => item.id === itemId)
  if (!itemToRemove) {
    return { success: false, error: "Item not found in order" }
  }

  // Check if this is the last item - don't allow removing if it's the only item
  if (order.order_items?.length <= 1) {
    return { success: false, error: "Cannot remove the last item. Cancel the entire order instead." }
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

    // Calculate the item's price
    let itemPrice = itemToRemove.unit_price || 0
    if (itemToRemove.item_type === "hotel" && itemToRemove.nights) {
      itemPrice = itemPrice * itemToRemove.nights
    }

    // Delete the order item
    const { error: deleteError } = await serviceClient
      .from("order_items")
      .delete()
      .eq("id", itemId)

    if (deleteError) {
      return { success: false, error: `Failed to remove item: ${deleteError.message}` }
    }

    // Update the order total
    const newTotal = Math.max(0, (order.total_amount || 0) - itemPrice)
    const { error: updateOrderError } = await serviceClient
      .from("orders")
      .update({
        total_amount: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateOrderError) {
      return { success: false, error: `Failed to update order total: ${updateOrderError.message}` }
    }

    // Update the payment amount if there's a payment record
    if (order.order_payments && order.order_payments.length > 0) {
      const { error: updatePaymentError } = await serviceClient
        .from("order_payments")
        .update({
          amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      if (updatePaymentError) {
        console.error("Failed to update payment amount:", updatePaymentError)
        // Don't fail the whole operation for this
      }
    }

    // Revalidate paths
    revalidatePath("/admin/payment-validation")
    revalidatePath("/my-purchases")

    return { success: true, newTotal }
  } catch (error: any) {
    return { success: false, error: `Failed to remove item: ${error.message || "Unknown error"}` }
  }
}
