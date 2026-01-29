import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface Recipient {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
}

interface BroadcastRequest {
  subject: string
  content: string
  recipients: Recipient[]
  segment: string
  scheduled?: {
    date: string
    time: string
  } | null
}

function generateEmailHtml(subject: string, content: string, recipientName: string): string {
  const logoUrl = "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/1.png"
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

export async function POST(request: NextRequest) {
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

    const body: BroadcastRequest = await request.json()
    const { subject, content, recipients, segment, scheduled } = body

    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // If scheduled, store for later (in production, use a job queue)
    if (scheduled) {
      // For now, we'll just log it - in production, you'd save to DB and use a cron job
      console.log(`[Email Broadcast] Scheduled for ${scheduled.date} at ${scheduled.time}`)
      console.log(`[Email Broadcast] Recipients: ${recipients.length}, Segment: ${segment}`)
      
      return NextResponse.json({
        success: true,
        message: `Email scheduled for ${scheduled.date} at ${scheduled.time}`,
        scheduledCount: recipients.length,
      })
    }

    // Send emails in batches to avoid rate limits
    const BATCH_SIZE = 5 // Reduced batch size for better reliability
    const DELAY_BETWEEN_BATCHES = 500 // 500ms delay
    const EMAIL_TIMEOUT = 10000 // 10 second timeout per email
    
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    console.log(`[Email Broadcast] Starting to send ${recipients.length} emails`)

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      console.log(`[Email Broadcast] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(recipients.length / BATCH_SIZE)}`)
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const recipientName = recipient.full_name || 
            (recipient.first_name && recipient.last_name 
              ? `${recipient.first_name} ${recipient.last_name}` 
              : recipient.email.split("@")[0])

          const htmlContent = generateEmailHtml(subject, content, recipientName)

          // Add timeout wrapper for each email
          const sendWithTimeout = Promise.race([
            resend.emails.send({
              from: "ISAPM 2026 <noreply@isapm2026.org>",
              to: recipient.email,
              subject: subject,
              html: htmlContent,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Email send timeout")), EMAIL_TIMEOUT)
            )
          ])

          await sendWithTimeout

          successCount++
          console.log(`[Email Broadcast] Sent to ${recipient.email}`)
          return { success: true, email: recipient.email }
        } catch (error) {
          failCount++
          const errorMsg = error instanceof Error ? error.message : "Unknown error"
          console.error(`[Email Broadcast] Failed for ${recipient.email}: ${errorMsg}`)
          errors.push(`${recipient.email}: ${errorMsg}`)
          return { success: false, email: recipient.email, error: errorMsg }
        }
      })

      await Promise.all(batchPromises)

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }

    console.log(`[Email Broadcast] Completed: ${successCount} sent, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Broadcast complete: ${successCount} emails sent, ${failCount} failed`,
      stats: {
        total: recipients.length,
        sent: successCount,
        failed: failCount,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Only return first 10 errors
    })
  } catch (error) {
    console.error("Error sending broadcast:", error)
    return NextResponse.json(
      { error: "Failed to send broadcast" },
      { status: 500 }
    )
  }
}
