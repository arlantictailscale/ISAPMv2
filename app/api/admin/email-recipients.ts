import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      console.error("[v0] Admin check failed:", profileError)
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const segment = request.nextUrl.searchParams.get("segment") || "all"

    // Fetch all users and their order/registration data
    let query = supabase.from("profiles").select(
      "id,full_name,first_name,last_name,institution"
    )

    // Apply segment filters
    if (segment !== "all") {
      // For specific segments, we need to join with orders/payments
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          user_id,
          status,
          order_items (
            event_id,
            item_type,
            event_label
          )
        `
        )
        .eq("status", "completed")

      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        return NextResponse.json(
          { error: "Failed to fetch orders" },
          { status: 500 }
        )
      }

      // Filter orders based on segment
      let filteredUserIds: string[] = []

      if (ordersData) {
        const userOrderMap = new Map<string, any[]>()

        for (const order of ordersData) {
          if (!userOrderMap.has(order.user_id)) {
            userOrderMap.set(order.user_id, [])
          }
          userOrderMap.get(order.user_id)!.push(...(order.order_items || []))
        }

        for (const [userId, items] of userOrderMap.entries()) {
          let matches = false

          if (segment === "symposium") {
            matches = items.some((item: any) => item.event_label?.includes("Symposium"))
          } else if (segment === "workshop") {
            matches = items.some((item: any) => item.event_label?.includes("Workshop"))
          } else if (segment === "webinar") {
            matches = items.some((item: any) => item.event_label?.includes("Webinar"))
          } else if (segment === "cpd") {
            matches = items.some((item: any) => item.event_label?.includes("CPD"))
          } else if (segment === "hotel") {
            matches = items.some((item: any) => item.item_type === "hotel")
          } else if (segment === "verified") {
            matches = true // Has completed order = verified payment
          }

          if (matches) {
            filteredUserIds.push(userId)
          }
        }
      }

      if (filteredUserIds.length > 0) {
        query = query.in("id", filteredUserIds)
      } else {
        // No matching users for this segment
        return NextResponse.json({ recipients: [] })
      }
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error("Error fetching profiles:", error)
      return NextResponse.json(
        { error: "Failed to fetch recipients" },
        { status: 500 }
      )
    }

    // Fetch emails from auth.users for each profile
    const recipients = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id)
        
        return {
          id: profile.id,
          email: authUser?.email || "",
          full_name: profile.full_name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          institution: profile.institution,
        }
      })
    )

    // Filter out users without email
    const validRecipients = recipients.filter((r) => r.email)

    return NextResponse.json({
      recipients: validRecipients,
      count: validRecipients.length,
    })
  } catch (error) {
    console.error("Error in email-recipients API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
