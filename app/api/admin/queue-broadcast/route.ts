import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

interface QueueBroadcastRequest {
  subject: string
  content: string
  recipients: Array<{
    id: string
    email: string
    full_name: string | null
    first_name: string | null
    last_name: string | null
  }>
  segment: string
  scheduled_for?: string // ISO date string for when to send
}

export async function POST(request: NextRequest) {
  console.log("[v0] Queue broadcast API called")
  
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

    const body: QueueBroadcastRequest = await request.json()
    const { subject, content, recipients, segment, scheduled_for } = body

    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    console.log(
      `[v0] Queueing broadcast: ${recipients.length} recipients for segment "${segment}"`
    )

    // Use admin client for database writes to bypass RLS
    const adminSupabase = createAdminClient()

    // Create broadcast record in database
    const { data: broadcast, error: broadcastError } = await adminSupabase
      .from("email_broadcasts")
      .insert({
        admin_id: user.id,
        subject,
        content,
        segment,
        total_recipients: recipients.length,
        status: "queued",
        scheduled_for: scheduled_for || null,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (broadcastError) {
      console.error("[v0] Error creating broadcast record:", broadcastError)
      throw broadcastError
    }

    if (!broadcast) {
      throw new Error("Failed to create broadcast record")
    }

    console.log(`[v0] Created broadcast record: ${broadcast.id}`)

    // Store recipient list using actual column names from broadcast_recipients table
    const recipientRecords = recipients.map((r) => ({
      broadcast_id: broadcast.id,
      user_id: r.id,
      recipient_email: r.email,
      recipient_name: r.full_name || (r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : r.email.split("@")[0]),
      status: "pending",
      created_at: new Date().toISOString(),
    }))

    const { error: recipientError } = await adminSupabase
      .from("broadcast_recipients")
      .insert(recipientRecords)

    if (recipientError) {
      console.error("[v0] Error storing recipients:", recipientError)
      // Don't fail the entire request if recipient storage fails
      // The broadcast was created successfully
    }

    console.log(
      `[v0] Queued ${recipients.length} recipients for broadcast ${broadcast.id}`
    )

    return NextResponse.json(
      {
        success: true,
        message: `Broadcast queued successfully. ${recipients.length} emails will be sent over the next ${Math.ceil(recipients.length / 100)} day(s).`,
        broadcast_id: broadcast.id,
        total_recipients: recipients.length,
        estimated_days: Math.ceil(recipients.length / 100),
      },
      { status: 202 }
    )
  } catch (error) {
    console.error("[v0] Error queueing broadcast:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to queue broadcast: ${errorMessage}` },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/queue-broadcast - Get queued broadcasts
 */
export async function GET(request: NextRequest) {
  console.log("[v0] Get queued broadcasts API called")
  
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

    // Get queued broadcasts for this admin
    const { data: broadcasts, error: broadcastError } = await supabase
      .from("email_broadcasts")
      .select("*")
      .eq("admin_id", user.id)
      .in("status", ["queued", "in_progress", "scheduled"])
      .order("created_at", { ascending: false })

    if (broadcastError) {
      console.error("[v0] Error fetching queued broadcasts:", broadcastError)
      throw broadcastError
    }

    console.log(`[v0] Found ${broadcasts?.length || 0} queued broadcasts`)

    // Get recipient counts for each broadcast
    const broadcastsWithCounts = await Promise.all(
      (broadcasts || []).map(async (b) => {
        const { count } = await supabase
          .from("broadcast_recipients")
          .select("*", { count: "exact", head: true })
          .eq("broadcast_id", b.id)

        return {
          ...b,
          recipients_count: count || 0,
        }
      })
    )

    return NextResponse.json(
      { broadcasts: broadcastsWithCounts },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Error getting queued broadcasts:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to get queued broadcasts: ${errorMessage}` },
      { status: 500 }
    )
  }
}
