import { createClient } from "@/lib/supabase/client"
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
 * Get today's email quota status for an admin user
 */
export async function getTodayQuotaStatus(
  admin_id: string
): Promise<QuotaStatus> {
  try {
    const supabase = createClient()
    
    // Get today's date in UTC
    const today = new Date().toISOString().split("T")[0]
    
    // Query email_send_logs for today
    const { data, error } = await supabase
      .from("email_send_logs")
      .select("sent_count, last_reset")
      .eq("admin_id", admin_id)
      .eq("date", today)
      .single()
    
    let sent_count = 0
    let last_reset = new Date().toISOString()
    
    if (!error && data) {
      sent_count = data.sent_count || 0
      last_reset = data.last_reset || new Date().toISOString()
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
    throw error
  }
}

/**
 * Record emails sent to track daily quota
 */
export async function recordEmailsSent(
  admin_id: string,
  count: number
): Promise<void> {
  try {
    const supabase = createClient()
    const today = new Date().toISOString().split("T")[0]
    
    // Get or create today's record
    const { data: existing, error: fetchError } = await supabase
      .from("email_send_logs")
      .select("*")
      .eq("admin_id", admin_id)
      .eq("date", today)
      .single()
    
    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }
    
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("email_send_logs")
        .update({
          sent_count: (existing.sent_count || 0) + count,
          last_reset: new Date().toISOString(),
        })
        .eq("admin_id", admin_id)
        .eq("date", today)
      
      if (updateError) throw updateError
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from("email_send_logs")
        .insert({
          admin_id,
          date: today,
          sent_count: count,
          last_reset: new Date().toISOString(),
        })
      
      if (insertError) throw insertError
    }
    
    console.log(`[v0] Recorded ${count} emails sent for admin ${admin_id}`)
  } catch (error) {
    console.error("[v0] Error recording sent emails:", error)
    throw error
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
