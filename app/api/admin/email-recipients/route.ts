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
      // Get all users from profiles table which includes email
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, first_name, last_name, institution")
        .not("email", "is", null)
      
      if (error) {
        console.error("[v0] Error fetching profiles:", error)
        throw error
      }

      console.log("[v0] Fetched profiles:", users?.length || 0)

      // If profiles don't have emails, try using admin client
      if (!users || users.length === 0 || !users[0]?.email) {
        console.log("[v0] Profiles don't have emails, trying admin client...")
        try {
          const adminSupabase = createAdminClient()
          const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers()
          
          if (authError) {
            console.error("[v0] Error fetching auth users:", authError)
          } else if (authUsers) {
            console.log("[v0] Fetched auth users:", authUsers.length)
            
            // Get profiles for additional info
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, first_name, last_name, institution")
            
            const profileMap = new Map(profileData?.map(p => [p.id, p]) || [])
            
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
          }
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
        // Profiles have emails
        recipients = users.map(u => ({
          id: u.id,
          email: u.email || "",
          full_name: u.full_name,
          first_name: u.first_name,
          last_name: u.last_name,
          institution: u.institution,
        })).filter(r => r.email)
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
        // Get users who have purchased specific item types
        const { data: orderItems } = await supabase
          .from("order_items")
          .select(`
            order_id,
            item_type,
            orders!inner (
              user_id,
              email,
              full_name
            ),
            order_payments:order_payments!order_id (
              payment_status
            )
          `)
          .ilike("item_type", `%${itemFilter}%`)

        const uniqueUsers = new Map()
        for (const item of orderItems || []) {
          const order = item.orders as any
          const payments = item.order_payments as any[]
          const hasVerifiedPayment = payments?.some(p => p.payment_status === "verified")
          
          if (order?.user_id && hasVerifiedPayment && !uniqueUsers.has(order.user_id)) {
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
