import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { recordEmailsSent } from "@/lib/email/quota-manager"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Process queued email broadcasts
 * This should be called periodically (e.g., every hour) via a cron job or scheduled task
 * 
 * GET /api/admin/process-queue?limit=30
 */
export async function GET(request: NextRequest) {
  console.log("[v0] Process queue API called")

  // Check for admin API key authentication (for cron jobs)
  const adminApiKey = request.headers.get("x-admin-api-key")
  if (adminApiKey !== process.env.ADMIN_API_KEY) {
    console.error("[v0] Unauthorized queue processor request")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50")

    console.log(`[v0] Processing queued broadcasts (limit: ${limit})`)

    // Get queued broadcasts that are ready to send
    const { data: broadcasts, error: broadcastError } = await supabase
      .from("email_broadcasts")
      .select("id, admin_id, subject, content, segment, total_recipients")
      .eq("status", "queued")
      .or("scheduled_for.is.null,scheduled_for.lte." + new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(limit)

    if (broadcastError) {
      console.error("[v0] Error fetching queued broadcasts:", broadcastError)
      throw broadcastError
    }

    if (!broadcasts || broadcasts.length === 0) {
      console.log("[v0] No queued broadcasts to process")
      return NextResponse.json({
        success: true,
        message: "No queued broadcasts to process",
        processed: 0,
      })
    }

    console.log(`[v0] Found ${broadcasts.length} queued broadcasts to process`)

    let totalProcessed = 0
    let totalFailed = 0

    // Process each broadcast
    for (const broadcast of broadcasts) {
      console.log(`[v0] Processing broadcast ${broadcast.id}`)

      // Update status to in_progress
      await supabase
        .from("email_broadcasts")
        .update({ status: "in_progress" })
        .eq("id", broadcast.id)

      // Get recipients for this broadcast
      const { data: recipients, error: recipientError } = await supabase
        .from("broadcast_recipients")
        .select("user_id, email, full_name, first_name, last_name")
        .eq("broadcast_id", broadcast.id)
        .eq("status", "pending")

      if (recipientError) {
        console.error(
          `[v0] Error fetching recipients for broadcast ${broadcast.id}:`,
          recipientError
        )
        continue
      }

      if (!recipients || recipients.length === 0) {
        console.log(`[v0] No pending recipients for broadcast ${broadcast.id}`)
        // Mark as completed
        await supabase
          .from("email_broadcasts")
          .update({ status: "completed" })
          .eq("id", broadcast.id)
        continue
      }

      console.log(
        `[v0] Processing ${recipients.length} recipients for broadcast ${broadcast.id}`
      )

      let batchSentCount = 0

      // Send emails with rate limiting (Resend free plan: 50/hour = 1 every 72 seconds)
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]

        try {
          const recipientName =
            recipient.full_name ||
            (recipient.first_name && recipient.last_name
              ? `${recipient.first_name} ${recipient.last_name}`
              : recipient.email.split("@")[0])

          const htmlContent = generateEmailHtml(
            broadcast.subject,
            broadcast.content,
            recipientName
          )

          // Send email via Resend
          const result = await resend.emails.send({
            from: "ISAPM 2026 <noreply@isapm2026.org>",
            to: recipient.email,
            subject: broadcast.subject,
            html: htmlContent,
          })

          // Mark recipient as sent
          await supabase
            .from("broadcast_recipients")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("broadcast_id", broadcast.id)
            .eq("user_id", recipient.user_id)

          batchSentCount++
          console.log(`[v0] Sent to ${recipient.email}`)

          // Rate limiting: 2 seconds between emails (30/min, safe for 50/hour limit)
          if (i < recipients.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        } catch (error) {
          console.error(`[v0] Failed to send to ${recipient.email}:`, error)
          totalFailed++

          // Mark as failed but continue
          await supabase
            .from("broadcast_recipients")
            .update({
              status: "failed",
              error_message:
                error instanceof Error ? error.message : "Unknown error",
            })
            .eq("broadcast_id", broadcast.id)
            .eq("user_id", recipient.user_id)
        }
      }

      // Record sent count to daily quota
      if (batchSentCount > 0) {
        try {
          await recordEmailsSent(broadcast.admin_id, batchSentCount)
        } catch (err) {
          console.error("[v0] Error recording sent emails:", err)
        }
      }

      // Check if all recipients processed
      const { data: pendingRecipients } = await supabase
        .from("broadcast_recipients")
        .select("id")
        .eq("broadcast_id", broadcast.id)
        .eq("status", "pending")

      if (!pendingRecipients || pendingRecipients.length === 0) {
        // All done - mark broadcast as completed
        await supabase
          .from("email_broadcasts")
          .update({ status: "completed" })
          .eq("id", broadcast.id)
        console.log(
          `[v0] Broadcast ${broadcast.id} completed (sent: ${batchSentCount})`
        )
      } else {
        console.log(
          `[v0] Broadcast ${broadcast.id} paused (${pendingRecipients.length} pending)`
        )
      }

      totalProcessed += batchSentCount
    }

    console.log(
      `[v0] Queue processing complete - sent: ${totalProcessed}, failed: ${totalFailed}`
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${broadcasts.length} queued broadcasts`,
      stats: {
        broadcasts_processed: broadcasts.length,
        emails_sent: totalProcessed,
        emails_failed: totalFailed,
      },
    })
  } catch (error) {
    console.error("[v0] Error processing queue:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to process queue: ${errorMessage}` },
      { status: 500 }
    )
  }
}

function generateEmailHtml(
  subject: string,
  content: string,
  recipientName: string
): string {
  const logoUrl =
    "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/1.png"
  const processedContent = content
    .replace(/\{\{name\}\}/g, recipientName)
    .replace(/\{\{message\}\}/g, "")
    .replace(/\n/g, "<br>")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .email-wrapper { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #00A9E0 0%, #0088B8 100%); color: white; padding: 30px; text-align: center; }
          .logo { max-width: 250px; height: auto; margin-bottom: 15px; }
          .content { padding: 30px; background: white; }
          .content p { margin: 0 0 15px 0; font-size: 15px; }
          .footer { text-align: center; padding: 25px 20px; color: #666; font-size: 12px; background: #f9f9f9; border-top: 1px solid #e2e8f0; }
          .footer-brand { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
          a { color: #00A9E0; text-decoration: none; }
          .button { display: inline-block; background: #EF3340; color: white !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <img src="${logoUrl}" alt="ISAPM 2026" class="logo" />
              <h1 style="margin: 0; font-size: 22px; font-weight: 600;">${subject}</h1>
            </div>
            <div class="content">
              ${processedContent}
            </div>
            <div class="footer">
              <div class="footer-brand">ISAPM 8th National Meeting 2026</div>
              <p><strong>The Indonesian Society of Anesthesiology for Pain Management</strong></p>
              <p style="margin-top: 12px;">
                April 16-19, 2026 | The Singhasari Resort, Batu, Malang, Indonesia
              </p>
              <p style="margin-top: 12px;">
                Email: <a href="mailto:admin@isapm2026.org">admin@isapm2026.org</a> | 
                Phone: <a href="https://wa.me/6289602626709">+6289602626709</a> (WhatsApp)
              </p>
              <p style="margin-top: 15px; font-size: 11px; color: #999;">
                You are receiving this email because you registered for ISAPM 2026.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}
