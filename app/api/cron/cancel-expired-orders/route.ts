import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

// Time limit for no_proof orders (24 hours in milliseconds)
const EXPIRATION_TIME_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function GET(request: NextRequest) {
  try {
    // Check if this is a manual trigger from admin panel
    const isManualTrigger = request.headers.get("x-manual-trigger") === "true"
    
    // Verify cron secret for security (skip for manual triggers from same origin)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!isManualTrigger && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      console.log("[v0] Unauthorized cron attempt - cancel-expired-orders")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[v0] Starting ${isManualTrigger ? "MANUAL" : "auto"}-cancel expired orders...`)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Missing Supabase credentials")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    // Calculate the cutoff time
    const cutoffTime = new Date(Date.now() - EXPIRATION_TIME_MS).toISOString()
    console.log("[v0] Looking for unpaid orders created before:", cutoffTime)

    // Strategy 1: Find orders with no_proof payment status
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
      console.error("[v0] Error fetching expired payments:", fetchError)
    }

    console.log("[v0] Found expired no_proof payment records:", expiredPayments?.length || 0)

    // Strategy 2: Find orders that have NO payment record at all (older orders)
    // First get all order IDs that DO have payment records
    const { data: ordersWithPayments } = await supabaseAdmin
      .from("order_payments")
      .select("order_id")
    
    const orderIdsWithPayments = new Set(ordersWithPayments?.map(p => p.order_id) || [])

    // Get all orders older than cutoff that are not cancelled/paid and have no payment record
    const { data: ordersWithoutPayments, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        status,
        created_at,
        user_id,
        full_name,
        email
      `)
      .lt("created_at", cutoffTime)
      .not("status", "in", '("cancelled","paid")')

    if (ordersError) {
      console.error("[v0] Error fetching orders without payments:", ordersError)
    }

    // Filter to only orders that don't have payment records
    const expiredOrdersWithoutPayments = (ordersWithoutPayments || []).filter(
      order => !orderIdsWithPayments.has(order.id)
    )

    console.log("[v0] Found expired orders without payment records:", expiredOrdersWithoutPayments.length)

    // Combine both lists
    const totalExpired = (expiredPayments?.length || 0) + expiredOrdersWithoutPayments.length

    if (totalExpired === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired orders to cancel",
        cancelled: 0,
      })
    }

    // Track results
    const results = {
      total: totalExpired,
      cancelled: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process expired orders WITH payment records (update both payment and order)
    for (const payment of expiredPayments || []) {
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
            notes: `Auto-cancelled: No payment proof uploaded within 24 hours. Original created at: ${payment.created_at}`,
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

        console.log(`[v0] Cancelled expired order (with payment record): ${payment.order_id} (User: ${order.full_name}, Email: ${order.email})`)
        results.cancelled++

      } catch (error: any) {
        console.error(`[v0] Exception cancelling order ${payment.order_id}:`, error)
        results.failed++
        results.errors.push(`Order ${payment.order_id}: ${error.message}`)
      }
    }

    // Process expired orders WITHOUT payment records (only update order status)
    for (const order of expiredOrdersWithoutPayments) {
      try {
        // Update order status to cancelled
        const { error: orderError } = await supabaseAdmin
          .from("orders")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        if (orderError) {
          console.error(`[v0] Error cancelling order ${order.id}:`, orderError)
          results.failed++
          results.errors.push(`Order ${order.id}: ${orderError.message}`)
          continue
        }

        console.log(`[v0] Cancelled expired order (no payment record): ${order.id} (User: ${order.full_name}, Email: ${order.email})`)
        results.cancelled++

      } catch (error: any) {
        console.error(`[v0] Exception cancelling order ${order.id}:`, error)
        results.failed++
        results.errors.push(`Order ${order.id}: ${error.message}`)
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
