import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseServiceKey) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the requesting user is an admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    console.log("[v0] Admin verified, fetching all poster submissions...")

    const { data: abstractsData, error: abstractsError } = await supabase
      .from("abstracts")
      .select("*")
      .order("created_at", { ascending: false })

    if (abstractsError) {
      console.error("[v0] Error fetching abstracts:", abstractsError)
      throw abstractsError
    }

    console.log("[v0] Fetched abstracts count:", abstractsData?.length || 0)

    // Fetch profiles for all abstract submitters
    const userIds = abstractsData?.map((a) => a.user_id).filter(Boolean) || []

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone")
      .in("id", userIds)

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
    }

    // Fetch validated events for all submitters
    // Get orders with verified or pending payments for these users
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        status,
        order_items (
          event_id,
          event_label,
          item_type
        ),
        order_payments (
          payment_status
        )
      `)
      .in("user_id", userIds)
      .neq("status", "cancelled")

    if (ordersError) {
      console.error("[v0] Error fetching orders for event validation:", ordersError)
    }

    // Build a map of user_id -> validated events
    const userValidatedEventsMap: Record<string, { event_id: string; event_label: string }[]> = {}
    
    ordersData?.forEach((order: any) => {
      const userId = order.user_id
      const paymentStatus = order.order_payments?.[0]?.payment_status
      
      // Consider verified or pending payment as validated (slot reserved)
      if (paymentStatus === "verified" || paymentStatus === "pending") {
        if (!userValidatedEventsMap[userId]) {
          userValidatedEventsMap[userId] = []
        }
        
        order.order_items?.forEach((item: any) => {
          if (item.item_type === "event" && item.event_id) {
            // Avoid duplicates
            const exists = userValidatedEventsMap[userId].some(e => e.event_id === item.event_id)
            if (!exists) {
              userValidatedEventsMap[userId].push({
                event_id: item.event_id,
                event_label: item.event_label || item.event_id,
              })
            }
          }
        })
      }
    })

    // Transform data to include user information
    const transformedData =
      abstractsData?.map((submission: any) => {
        const profile = profilesData?.find((p) => p.id === submission.user_id)
        const userName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : ""
        const userEmail = submission.email || ""

        let topic = ""
        let cleanKeywords = submission.keywords || ""

        const topicMatch = submission.keywords?.match(/^\[(.*?)\]\s*(.*)/)
        if (topicMatch) {
          topic = topicMatch[1]
          cleanKeywords = topicMatch[2]
        }

        return {
          ...submission,
          user_email: userEmail,
          user_name: userName,
          user_phone: profile?.phone || null,
          topic,
          keywords: cleanKeywords,
          university: submission.university || null,
          validated_events: userValidatedEventsMap[submission.user_id] || [],
        }
      }) || []

    return NextResponse.json({ submissions: transformedData })
  } catch (error) {
    console.error("[v0] Error in admin posters API:", error)
    return NextResponse.json({ error: "Failed to fetch poster submissions" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseServiceKey) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the requesting user is an admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Parse the request body
    const body = await request.json()
    const { id, submission_status, rejection_comment, can_resubmit } = body

    if (!id || !submission_status) {
      return NextResponse.json({ error: "Missing required fields: id and submission_status" }, { status: 400 })
    }

    console.log("[v0] Admin updating poster submission:", { id, submission_status, rejection_comment, can_resubmit })

    // Prepare update data
    const updateData: Record<string, any> = {
      submission_status,
      updated_at: new Date().toISOString(),
    }

    // Only include rejection fields if rejecting
    if (submission_status === "rejected") {
      updateData.rejection_comment = rejection_comment || null
      updateData.can_resubmit = can_resubmit !== undefined ? can_resubmit : true
    } else if (submission_status === "accepted") {
      // Clear rejection fields if accepting
      updateData.rejection_comment = null
      updateData.can_resubmit = false
    }

    // Update the submission using service role (bypasses RLS)
    const { data: updatedData, error: updateError } = await supabase
      .from("abstracts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating poster submission:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("[v0] Successfully updated poster submission:", updatedData)

    return NextResponse.json({
      success: true,
      submission: updatedData,
      message: `Submission ${submission_status} successfully`,
    })
  } catch (error: any) {
    console.error("[v0] Error in admin posters PATCH API:", error)
    return NextResponse.json({ error: error.message || "Failed to update poster submission" }, { status: 500 })
  }
}
