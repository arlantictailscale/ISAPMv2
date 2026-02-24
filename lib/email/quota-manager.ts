import { createAdminClient } from "@/lib/supabase/admin"

// Resend Free Plan Limits
export const RESEND_FREE_LIMITS = {
  DAILY_LIMIT: 100, // emails per day
  HOURLY_LIMIT: 50, // emails per hour
  MAX_EMAILS_PER_REQUEST: 100, // conservative batch size for reliability
}

// Email quota tracking types
export interface DailyQuota {
  date: string
  admin_id: string
  sent_count: number
  remaining: number
  last_reset: string
}

export interface QuotaStatus {
  sent_today: number
  remaining_today: number
  daily_limit: number
  reset_time: string
  can_send: boolean
  is_over_quota: boolean
}

/**
 * Get today's email quota status for an admin user.
 * Uses the admin client to bypass RLS since send logs may not have user-specific policies.
 */
export async function getTodayQuotaStatus(
  admin_id: string
): Promise<QuotaStatus> {
  try {
    const supabase = createAdminClient()
    
    // Get today's date in UTC
    const today = new Date().toISOString().split("T")[0]
    
    // Query email_send_logs for today
    const { data, error } = await supabase
      .from("email_send_logs")
      .select("sent_count, last_updated_at")
      .eq("admin_id", admin_id)
      .eq("send_date", today)
      .single()
    
    let sent_count = 0
    
    if (!error && data) {
      sent_count = data.sent_count || 0
    }
    
    const remaining = Math.max(0, RESEND_FREE_LIMITS.DAILY_LIMIT - sent_count)
    
    // Calculate next reset time (00:00 UTC tomorrow)
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    
    return {
      sent_today: sent_count,
      remaining_today: remaining,
      daily_limit: RESEND_FREE_LIMITS.DAILY_LIMIT,
      reset_time: tomorrow.toISOString(),
      can_send: remaining > 0,
      is_over_quota: sent_count >= RESEND_FREE_LIMITS.DAILY_LIMIT,
    }
  } catch (error) {
    console.error("[v0] Error getting quota status:", error)
    // Return safe defaults so the system doesn't break
    return {
      sent_today: 0,
      remaining_today: RESEND_FREE_LIMITS.DAILY_LIMIT,
      daily_limit: RESEND_FREE_LIMITS.DAILY_LIMIT,
      reset_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      can_send: true,
      is_over_quota: false,
    }
  }
}

/**
 * Record emails sent to track daily quota.
 * Uses admin client to bypass RLS for insert/update operations.
 */
export async function recordEmailsSent(
  admin_id: string,
  count: number
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split("T")[0]
    
    // Get or create today's record
    const { data: existing, error: fetchError } = await supabase
      .from("email_send_logs")
      .select("id, sent_count")
      .eq("admin_id", admin_id)
      .eq("send_date", today)
      .single()
    
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[v0] Error fetching send log:", fetchError)
      return // Don't throw - quota tracking failure shouldn't block sending
    }
    
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("email_send_logs")
        .update({
          sent_count: (existing.sent_count || 0) + count,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
      
      if (updateError) {
        console.error("[v0] Error updating send log:", updateError)
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from("email_send_logs")
        .insert({
          admin_id,
          send_date: today,
          sent_count: count,
          last_updated_at: new Date().toISOString(),
        })
      
      if (insertError) {
        console.error("[v0] Error inserting send log:", insertError)
      }
    }
  } catch (error) {
    console.error("[v0] Error recording sent emails:", error)
    // Don't throw - quota tracking failure shouldn't block sending
  }
}

/**
 * Check if a 429 rate limit error occurred
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false
  
  // Check for 429 status code
  if (error.status === 429) return true
  
  // Check for Resend API rate limit response
  if (error.message?.includes("rate limit") || 
      error.message?.includes("too many requests")) {
    return true
  }
  
  return false
}

/**
 * Calculate exponential backoff delay (in ms)
 */
export function calculateBackoffDelay(attempt: number): number {
  // Start with 1 second, double for each retry
  // Max out at 30 seconds
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 1000
  return delay + jitter
}

/**
 * Determine if broadcast should be queued based on recipient count and daily quota
 */
export async function shouldQueueBroadcast(
  admin_id: string,
  recipient_count: number
): Promise<{
  should_queue: boolean
  reason: string | null
  queue_day: number | null // Number of days needed to send all emails
}> {
  try {
    const quota = await getTodayQuotaStatus(admin_id)
    
    if (!quota.can_send) {
      return {
        should_queue: true,
        reason: "Daily quota exhausted (100/100 emails sent today)",
        queue_day: Math.ceil(recipient_count / RESEND_FREE_LIMITS.DAILY_LIMIT),
      }
    }
    
    // If broadcast exceeds remaining quota for today + tomorrow
    const emailsNeeded = recipient_count
    const availableToday = quota.remaining_today
    
    // If we can't send all today, queue the rest
    if (emailsNeeded > availableToday) {
      const daysNeeded = Math.ceil(emailsNeeded / RESEND_FREE_LIMITS.DAILY_LIMIT)
      return {
        should_queue: daysNeeded > 1,
        reason: daysNeeded > 1 
          ? `Will send over ${daysNeeded} days (${availableToday} today, ${RESEND_FREE_LIMITS.DAILY_LIMIT}/day after)`
          : null,
        queue_day: daysNeeded,
      }
    }
    
    return {
      should_queue: false,
      reason: null,
      queue_day: null,
    }
  } catch (error) {
    console.error("[v0] Error checking queue status:", error)
    // If we can't determine quota, be conservative and queue large broadcasts
    return {
      should_queue: recipient_count > RESEND_FREE_LIMITS.DAILY_LIMIT,
      reason: "Could not verify quota, queuing large broadcast as precaution",
      queue_day: Math.ceil(recipient_count / RESEND_FREE_LIMITS.DAILY_LIMIT),
    }
  }
}
