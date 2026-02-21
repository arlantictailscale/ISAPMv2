import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const segment = request.nextUrl.searchParams.get("segment") || "all"

    let recipients: Array<{
      id: string
      email: string
      full_name: string | null
      first_name: string | null
      last_name: string | null
      institution: string | null
    }> = []

    if (segment === "all") {
      // Get all users from profiles table
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, institution")
      
      if (error) {
        console.error("[v0] Error fetching profiles:", error)
        throw error
      }

      console.log("[v0] Fetched profiles:", users?.length || 0)

      // Profiles don't have emails - fetch from auth.users
      try {
        const adminSupabase = createAdminClient()
        const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers()
        
        if (authError) {
          console.error("[v0] Error fetching auth users:", authError)
          throw authError
        }
        
        if (!authUsers) {
          return NextResponse.json({ recipients: [], segment: "all" })
        }

        console.log("[v0] Fetched auth users:", authUsers.length)
        
        // Create profile map for quick lookup
        const profileMap = new Map(users?.map(p => [p.id, p]) || [])
        
        // Map auth users to recipients with profile info
        recipients = authUsers
          .filter(u => u.email)
          .map(u => {
            const profileInfo = profileMap.get(u.id)
            return {
              id: u.id,
              email: u.email || "",
              full_name: profileInfo?.full_name || u.user_metadata?.full_name || null,
              first_name: profileInfo?.first_name || null,
              last_name: profileInfo?.last_name || null,
              institution: profileInfo?.institution || null,
            }
          })
        
        console.log("[v0] Mapped to recipients:", recipients.length)
      } catch (adminError) {
        console.error("[v0] Admin client error:", adminError)
        // Fallback: try to get emails from orders table
        const { data: orders } = await supabase
          .from("orders")
          .select("user_id, email, full_name")
          .not("email", "is", null)
        
        if (orders && orders.length > 0) {
          const uniqueUsers = new Map()
          for (const order of orders) {
            if (order.user_id && order.email && !uniqueUsers.has(order.user_id)) {
              uniqueUsers.set(order.user_id, {
                id: order.user_id,
                email: order.email,
                full_name: order.full_name,
                first_name: null,
                last_name: null,
                institution: null,
              })
            }
          }
          recipients = Array.from(uniqueUsers.values())
          console.log("[v0] Using orders table fallback, found:", recipients.length)
        }
      }
    } else {
      // Get users based on their purchases
      let itemFilter = ""
      
      switch (segment) {
        case "symposium":
          itemFilter = "symposium"
          break
        case "workshop":
          itemFilter = "workshop"
          break
        case "webinar":
          itemFilter = "webinar"
          break
        case "cpd":
          itemFilter = "cpd"
          break
        case "hotel":
          itemFilter = "hotel"
          break
        case "verified":
        case "pending":
          // Handle payment status filter
          const paymentStatus = segment === "verified" ? "verified" : "pending"
          const { data: paymentOrders } = await supabase
            .from("order_payments")
            .select(`
              order_id,
              orders!inner (
                user_id,
                email,
                full_name
              )
            `)
            .eq("payment_status", paymentStatus)

          const uniqueUsers = new Map()
          for (const payment of paymentOrders || []) {
            const order = payment.orders as any
            if (order?.user_id && !uniqueUsers.has(order.user_id)) {
              uniqueUsers.set(order.user_id, {
                id: order.user_id,
                email: order.email,
                full_name: order.full_name,
                first_name: null,
                last_name: null,
                institution: null,
              })
            }
          }
          recipients = Array.from(uniqueUsers.values())
          return NextResponse.json({ recipients, segment })
        default:
          itemFilter = ""
      }

      if (itemFilter) {
        // Get users who have purchased specific item types with verified payments
        // First get all orders with verified payments
        const { data: verifiedPayments } = await supabase
          .from("order_payments")
          .select("order_id")
          .eq("payment_status", "verified")
        
        const verifiedOrderIds = new Set(verifiedPayments?.map(p => p.order_id) || [])
        
        // Build the query based on segment type
        // For symposium, workshop, cpd: item_type is "event" and we filter by event_id
        // For hotel: item_type is "hotel"
        // For webinar: item_type is "webinar"
        let query = supabase
          .from("order_items")
          .select(`
            order_id,
            item_type,
            event_id,
            orders!inner (
              user_id,
              email,
              full_name
            )
          `)
        
        if (itemFilter === "symposium") {
          // Symposium: item_type = 'event' AND event_id = 'symposium'
          query = query.eq("item_type", "event").eq("event_id", "symposium")
        } else if (itemFilter === "workshop") {
          // Workshop: item_type = 'event' AND event_id starts with 'ws'
          query = query.eq("item_type", "event").ilike("event_id", "ws%")
        } else if (itemFilter === "cpd") {
          // CPD: item_type = 'event' AND event_id = 'cpd'
          query = query.eq("item_type", "event").eq("event_id", "cpd")
        } else if (itemFilter === "hotel") {
          // Hotel: item_type = 'hotel'
          query = query.eq("item_type", "hotel")
        } else if (itemFilter === "webinar") {
          // Webinar: item_type = 'webinar'
          query = query.eq("item_type", "webinar")
        }
        
        const { data: orderItems, error: itemsError } = await query
        
        if (itemsError) {
          console.error("[v0] Error fetching order items:", itemsError)
        }

        console.log(`[v0] Found ${orderItems?.length || 0} order items for filter: ${itemFilter}`)

        const uniqueUsers = new Map()
        for (const item of orderItems || []) {
          const order = item.orders as any
          const hasVerifiedPayment = verifiedOrderIds.has(item.order_id)
          
          if (order?.user_id && order?.email && hasVerifiedPayment && !uniqueUsers.has(order.user_id)) {
            uniqueUsers.set(order.user_id, {
              id: order.user_id,
              email: order.email,
              full_name: order.full_name,
              first_name: null,
              last_name: null,
              institution: null,
            })
          }
        }
        recipients = Array.from(uniqueUsers.values())
        console.log(`[v0] Found ${recipients.length} unique users with verified payments for ${itemFilter}`)
      }
    }

    console.log(`[v0] Returning ${recipients.length} recipients for segment: ${segment}`)
    return NextResponse.json({ recipients, segment })
  } catch (error) {
    console.error("[v0] Error fetching email recipients:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipients", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
