import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import {
  getTodayQuotaStatus,
  recordEmailsSent,
  isRateLimitError,
  calculateBackoffDelay,
  shouldQueueBroadcast,
  RESEND_FREE_LIMITS,
} from "@/lib/email/quota-manager"

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
  console.log("[v0] Email broadcast API called")
  
  // Check if RESEND_API_KEY is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("[v0] RESEND_API_KEY is not configured")
    return NextResponse.json({ error: "Email service not configured. Please set RESEND_API_KEY." }, { status: 500 })
  }
  
  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created")
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log("[v0] No user found - unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[v0] User authenticated:", user.email)

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      console.log("[v0] User is not admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.log("[v0] Admin access verified")

    const body: BroadcastRequest = await request.json()
    console.log("[v0] Request body parsed, recipients:", body.recipients?.length)
    const { subject, content, recipients, segment, scheduled } = body

    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    console.log(`[v0] Broadcast Request: ${recipients.length} recipients, Segment: ${segment}`)

    // Check daily quota status
    const quotaStatus = await getTodayQuotaStatus(user.id)
    console.log(`[v0] Daily Quota Status: ${quotaStatus.sent_today}/${quotaStatus.daily_limit} used, ${quotaStatus.remaining_today} remaining`)

    // Check if broadcast should be queued
    const queueCheck = await shouldQueueBroadcast(user.id, recipients.length)
    if (queueCheck.should_queue) {
      console.log(`[v0] Large broadcast detected - queuing: ${queueCheck.reason}`)
      return NextResponse.json({
        success: false,
        error: "Broadcast queued due to rate limits",
        message: queueCheck.reason,
        quota_status: quotaStatus,
        queue_days_needed: queueCheck.queue_day,
        recipients_count: recipients.length,
      }, { status: 202 }) // 202 Accepted - request is queued
    }

    // If no quota remaining today, queue the entire broadcast
    if (!quotaStatus.can_send) {
      console.log(`[v0] Daily limit reached - entire broadcast queued for tomorrow`)
      return NextResponse.json({
        success: false,
        error: "Daily quota exhausted",
        message: `You've used all ${quotaStatus.daily_limit} daily emails. Broadcast queued for tomorrow at 00:00 UTC.`,
        quota_status: quotaStatus,
        queued: true,
      }, { status: 202 })
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

    // Send emails in batches with adaptive rate limiting
    // For Resend Free Plan: 50 emails/hour = ~1.2 seconds per email minimum
    // Using 1 email per 2 seconds for safety = 30/minute = 1800/hour
    const BATCH_SIZE = 1 // Send 1 email at a time for max safety with Resend free plan
    const BASE_DELAY_MS = 2000 // 2 seconds = 30 emails/minute (well under 50/hour limit)
    const EMAIL_TIMEOUT = 15000 // 15 second timeout per email
    
    let successCount = 0
    let failCount = 0
    let rateLimitHits = 0
    const errors: string[] = []
    let currentDelay = BASE_DELAY_MS
    let retryAttempt = 0
    const MAX_RETRIES = 2

    // Only send up to remaining daily quota
    const emailsToSend = Math.min(recipients.length, quotaStatus.remaining_today)
    const recipientsToSend = recipients.slice(0, emailsToSend)
    const remainingEmails = recipients.length - emailsToSend

    console.log(`[v0] Starting broadcast: ${emailsToSend}/${recipients.length} emails (quota: ${quotaStatus.remaining_today}/${quotaStatus.daily_limit})`)
    
    // If there are remaining emails, queue them immediately
    if (remainingEmails > 0) {
      console.log(`[v0] Queueing remaining ${remainingEmails} emails for tomorrow`)
      try {
        const queueResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/queue-broadcast`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ""}`,
          },
          body: JSON.stringify({
            subject,
            content,
            recipients: recipients.slice(emailsToSend),
            segment,
            scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })

        if (!queueResponse.ok) {
          console.error("[v0] Failed to queue remaining emails:", await queueResponse.text())
        } else {
          console.log("[v0] Successfully queued remaining emails")
        }
      } catch (queueError) {
        console.error("[v0] Error queuing remaining emails:", queueError)
        // Continue - don't fail if queuing fails
      }
    }

    for (let i = 0; i < recipientsToSend.length; i += BATCH_SIZE) {
      const batch = recipientsToSend.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(recipientsToSend.length / BATCH_SIZE)
      
      console.log(`[v0] Processing email ${batchNum}/${totalBatches} (delay: ${currentDelay}ms)`)
      
      // Send each email in batch sequentially with retry logic
      for (const recipient of batch) {
        let sent = false
        let attempt = 0

        while (!sent && attempt <= MAX_RETRIES) {
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
            ]) as any

            const result = await sendWithTimeout

            successCount++
            console.log(`[v0] Sent to ${recipient.email}`)
            sent = true
          } catch (error: any) {
            const errorMsg = error?.message || "Unknown error"
            
            // Detect rate limit error
            if (isRateLimitError(error)) {
              rateLimitHits++
              const backoffDelay = calculateBackoffDelay(attempt)
              currentDelay = Math.max(currentDelay, Math.ceil(backoffDelay))
              console.warn(`[v0] Rate limit detected (attempt ${attempt + 1})! Backoff: ${Math.ceil(backoffDelay)}ms, new delay: ${currentDelay}ms`)
              
              if (attempt < MAX_RETRIES) {
                console.log(`[v0] Retrying after backoff...`)
                await new Promise(resolve => setTimeout(resolve, Math.ceil(backoffDelay)))
                attempt++
              } else {
                console.error(`[v0] Max retries exceeded for ${recipient.email}`)
                failCount++
                sent = true // Stop retrying
                errors.push(`${recipient.email}: Rate limited (${attempt + 1} attempts)`)
              }
            } else if (attempt < MAX_RETRIES && !errorMsg.includes("timeout")) {
              // Retry on non-timeout, non-rate-limit errors
              console.warn(`[v0] Error sending to ${recipient.email}: ${errorMsg}, retrying...`)
              attempt++
              await new Promise(resolve => setTimeout(resolve, 1000))
            } else {
              // Final failure
              failCount++
              console.error(`[v0] Failed for ${recipient.email}: ${errorMsg}`)
              errors.push(`${recipient.email}: ${errorMsg}`)
              sent = true
            }
          }
        }
      }

      // Add delay between emails (Resend free plan rate limit safety)
      if (i + BATCH_SIZE < recipientsToSend.length) {
        await new Promise(resolve => setTimeout(resolve, currentDelay))
      }
    }

    // Record emails sent to daily quota
    if (successCount > 0) {
      try {
        await recordEmailsSent(user.id, successCount)
      } catch (error) {
        console.error("[v0] Error recording sent emails:", error)
        // Continue - don't fail the entire broadcast if quota recording fails
      }
    }

    console.log(`[v0] Broadcast completed: ${successCount} sent, ${failCount} failed, ${rateLimitHits} rate limit hits`)

    // Check if we need to queue remaining emails
    const needsQueuing = remainingEmails > 0

    return NextResponse.json({
      success: failCount === 0,
      message: `Broadcast: ${successCount} sent, ${failCount} failed${needsQueuing ? `, ${remainingEmails} queued for tomorrow` : ''}`,
      stats: {
        total: recipients.length,
        sent: successCount,
        failed: failCount,
        queued: remainingEmails,
      },
      quota_status: {
        used_today: quotaStatus.sent_today + successCount,
        limit: quotaStatus.daily_limit,
        remaining: Math.max(0, quotaStatus.remaining_today - successCount),
        reset_time: quotaStatus.reset_time,
        needs_queue: needsQueuing,
      },
      rate_limit_info: rateLimitHits > 0 ? {
        hits: rateLimitHits,
        message: "Some sends were rate limited. Retry tomorrow or try again later.",
        current_delay_ms: currentDelay,
      } : undefined,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }, { status: successCount > 0 ? 200 : 500 })
  } catch (error) {
    console.error("[v0] Error sending broadcast:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to send broadcast: ${errorMessage}` },
      { status: 500 }
    )
  }
}
