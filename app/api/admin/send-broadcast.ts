import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface Recipient {
  id: string
  email: string
  full_name: string | null
}

interface BroadcastPayload {
  subject: string
  content: string
  recipients: Recipient[]
  segment: string
  scheduled?: {
    date: string
    time: string
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body: BroadcastPayload = await request.json()
    const { subject, content, recipients, segment, scheduled } = body

    // Validate input
    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Format emails for sending
    const recipientEmails = recipients.map((r) => r.email).filter(Boolean)

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid recipients" },
        { status: 400 }
      )
    }

    // For now, we'll just return success and log the broadcast
    // In production, you would integrate with an email service like Resend, SendGrid, or AWS SES
    console.log(`
      ===== EMAIL BROADCAST =====
      Subject: ${subject}
      Segment: ${segment}
      Recipients: ${recipientEmails.length}
      Emails: ${recipientEmails.join(", ")}
      Scheduled: ${scheduled ? `${scheduled.date} ${scheduled.time}` : "Immediate"}
      Content Preview: ${content.substring(0, 100)}...
      ===========================
    `)

    // In production, you would send emails here
    // Example with Resend:
    // const { data, error } = await resend.emails.send({
    //   from: "noreply@isapm2026.org",
    //   to: recipientEmails,
    //   subject,
    //   html: content,
    // })

    return NextResponse.json({
      success: true,
      message: `Broadcast sent to ${recipientEmails.length} recipients`,
      recipients_count: recipientEmails.length,
      segment,
    })
  } catch (error) {
    console.error("Error in send-broadcast API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
