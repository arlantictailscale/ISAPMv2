import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

// Time limit for no_proof orders (1 hour in milliseconds)
const EXPIRATION_TIME_MS = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Unauthorized cron attempt - cancel-expired-orders")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting auto-cancel expired orders cron job...")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Missing Supabase credentials")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    // Calculate the cutoff time (1 hour ago)
    const cutoffTime = new Date(Date.now() - EXPIRATION_TIME_MS).toISOString()
    console.log("[v0] Looking for no_proof orders created before:", cutoffTime)

    // Find all orders with no_proof payment status that are older than 1 hour
    // These are orders where payment hasn't been uploaded yet
    const { data: expiredPayments, error: fetchError } = await supabaseAdmin
      .from("order_payments")
      .select(`
        id,
        order_id,
        payment_status,
        created_at,
        orders!order_payments_order_id_fkey (
          id,
          status,
          created_at,
          user_id,
          full_name,
          email
        )
      `)
      .eq("payment_status", "no_proof")
      .lt("created_at", cutoffTime)

    if (fetchError) {
      console.error("[v0] Error fetching expired orders:", fetchError)
      return NextResponse.json({ error: "Failed to fetch expired orders" }, { status: 500 })
    }

    console.log("[v0] Found expired no_proof orders:", expiredPayments?.length || 0)

    if (!expiredPayments || expiredPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired orders to cancel",
        cancelled: 0,
      })
    }

    // Track results
    const results = {
      total: expiredPayments.length,
      cancelled: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Cancel each expired order
    for (const payment of expiredPayments) {
      const order = payment.orders as any
      
      // Skip if order is already cancelled or paid
      if (!order || order.status === "cancelled" || order.status === "paid") {
        console.log(`[v0] Skipping order ${payment.order_id} - already ${order?.status || "missing"}`)
        continue
      }

      try {
        // Update payment status to expired
        const { error: paymentError } = await supabaseAdmin
          .from("order_payments")
          .update({
            payment_status: "expired",
            notes: `Auto-cancelled: No payment proof uploaded within 1 hour. Original created at: ${payment.created_at}`,
          })
          .eq("id", payment.id)

        if (paymentError) {
          console.error(`[v0] Error updating payment ${payment.id}:`, paymentError)
          results.failed++
          results.errors.push(`Payment ${payment.id}: ${paymentError.message}`)
          continue
        }

        // Update order status to cancelled
        const { error: orderError } = await supabaseAdmin
          .from("orders")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.order_id)

        if (orderError) {
          console.error(`[v0] Error cancelling order ${payment.order_id}:`, orderError)
          results.failed++
          results.errors.push(`Order ${payment.order_id}: ${orderError.message}`)
          continue
        }

        console.log(`[v0] Successfully cancelled expired order: ${payment.order_id} (User: ${order.full_name}, Email: ${order.email})`)
        results.cancelled++

      } catch (error: any) {
        console.error(`[v0] Exception cancelling order ${payment.order_id}:`, error)
        results.failed++
        results.errors.push(`Order ${payment.order_id}: ${error.message}`)
      }
    }

    console.log(`[v0] Auto-cancel complete. Cancelled: ${results.cancelled}, Failed: ${results.failed}`)

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} expired orders`,
      cancelled: results.cancelled,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })

  } catch (error: any) {
    console.error("[v0] Error in cancel-expired-orders cron:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
