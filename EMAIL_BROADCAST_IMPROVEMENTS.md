# Email Broadcast - Technical Improvements & Code Quality Guide

## Overview

This document outlines recommended improvements to make the email broadcast system more robust, maintainable, and user-friendly.

---

## Priority 1: Critical Fixes (Do Immediately)

### 1.1 Validate RESEND_API_KEY at Application Startup

**Current Issue:** If `RESEND_API_KEY` is missing, users only find out after clicking "Confirm & Send"

**Recommended Fix:**
```typescript
// lib/email/validate-config.ts
export function validateEmailConfig() {
  const errors: string[] = []
  
  if (!process.env.RESEND_API_KEY) {
    errors.push("RESEND_API_KEY environment variable is not set")
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL environment variable is not set")
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY environment variable is not set")
  }
  
  if (errors.length > 0) {
    const errorMsg = `Email service configuration errors:\n${errors.join('\n')}`
    console.error("[v0] EMAIL CONFIG ERROR:", errorMsg)
    // In production, throw error to prevent app startup
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg)
    }
  }
  
  return errors.length === 0
}

// app/layout.tsx or app.tsx
import { validateEmailConfig } from '@/lib/email/validate-config'

if (process.env.NODE_ENV === 'production') {
  validateEmailConfig()
}
```

**Benefit:** Catch configuration issues immediately instead of runtime failures

---

### 1.2 Add Retry Logic with Exponential Backoff

**Current Issue:** API may fail temporarily but shows final error to user

**Current Code (api/admin/send-broadcast/route.ts):**
```typescript
const response = await resend.emails.send({...})
// Single attempt - if fails, counts as failure
```

**Recommended Improvement:**
```typescript
// lib/email/resend-utils.ts
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  maxRetries = 3
): Promise<{ id: string; error?: Error }> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await resend.emails.send({
        from: "ISAPM 2026 <noreply@isapm2026.org>",
        to,
        subject,
        html,
      })
      
      if (response.error) {
        throw new Error(`Resend error: ${response.error.message}`)
      }
      
      console.log(`[v0] Email sent to ${to} (attempt ${attempt + 1})`)
      return { id: response.data!.id }
    } catch (error) {
      lastError = error as Error
      const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s, 4s
      
      if (attempt < maxRetries - 1) {
        console.warn(`[v0] Send failed for ${to}, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  return { id: '', error: lastError || new Error('Unknown error') }
}
```

**Benefit:** Temporary failures (network blips, rate limits) won't permanently fail sends

---

### 1.3 Implement Real Bounce Handling

**Current Issue:** Failed emails silently added to error list but never retried

**Recommended Implementation:**
```typescript
// lib/email/bounce-handler.ts
interface EmailEvent {
  email: string
  status: 'delivered' | 'bounce' | 'complained' | 'failed'
  timestamp: string
  error?: string
}

async function recordEmailEvent(event: EmailEvent) {
  const { error } = await supabase
    .from('email_events')
    .insert({
      recipient_email: event.email,
      status: event.status,
      event_timestamp: event.timestamp,
      error_message: event.error,
    })
  
  if (error) {
    console.error("[v0] Failed to record email event:", error)
  }
}

// In broadcast API, after sending:
async function trackSendResult(
  recipientEmail: string,
  sendResult: { id?: string; error?: Error }
) {
  if (sendResult.error) {
    await recordEmailEvent({
      email: recipientEmail,
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: sendResult.error.message,
    })
  } else {
    await recordEmailEvent({
      email: recipientEmail,
      status: 'delivered',
      timestamp: new Date().toISOString(),
    })
  }
}
```

**Benefit:** Track which emails failed and why for debugging and audit trails

---

## Priority 2: Reliability Improvements

### 2.1 Implement Webhook Handling for Delivery Tracking

**Current Issue:** We don't know if emails actually reached recipient's mailbox

**Recommended Implementation:**
```typescript
// app/api/webhooks/resend/route.ts
export async function POST(request: NextRequest) {
  const payload = await request.json()
  
  console.log("[v0] Resend webhook received:", payload.type)
  
  // Verify webhook signature
  const signature = request.headers.get('x-resend-signature')
  if (!verifyResendSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Handle different event types
  switch (payload.type) {
    case 'email.delivered':
      await updateEmailStatus(payload.email_id, 'delivered')
      break
    case 'email.bounced':
      await updateEmailStatus(payload.email_id, 'bounced')
      break
    case 'email.complained':
      await updateEmailStatus(payload.email_id, 'complained')
      break
    case 'email.failed':
      await updateEmailStatus(payload.email_id, 'failed', payload.error)
      break
  }
  
  return NextResponse.json({ success: true })
}

async function updateEmailStatus(
  emailId: string,
  status: string,
  error?: string
) {
  // Update email_events or broadcast_recipients status
  const { error: dbError } = await supabase
    .from('email_events')
    .update({ 
      status,
      error_message: error,
      updated_at: new Date().toISOString()
    })
    .eq('resend_email_id', emailId)
  
  if (dbError) {
    console.error("[v0] Failed to update email status:", dbError)
  }
}
```

**Benefit:** Real-time delivery confirmation and bounce handling

---

### 2.2 Add Circuit Breaker Pattern for Resend API

**Current Issue:** If Resend service is down, all sends fail

**Recommended Implementation:**
```typescript
// lib/email/circuit-breaker.ts
class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private readonly failureThreshold = 5
  private readonly resetTimeout = 60000 // 1 minute
  
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open'
      } else if (fallback) {
        console.warn("[v0] Circuit breaker OPEN - using fallback")
        return fallback()
      } else {
        throw new Error('Circuit breaker OPEN - Resend service temporarily unavailable')
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failureCount = 0
    this.state = 'closed'
  }
  
  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
    }
  }
}

export const resendCircuitBreaker = new CircuitBreaker()
```

**Usage in send-broadcast:**
```typescript
const result = await resendCircuitBreaker.execute(
  () => resend.emails.send({ to, subject, html }),
  () => queueForLaterAttempt(to, subject, html) // Fallback
)
```

**Benefit:** Graceful degradation when external service fails

---

### 2.3 Implement Database Transaction for Atomic Operations

**Current Issue:** If recording send partially fails, quota tracking is inconsistent

**Recommended Fix:**
```typescript
// In send-broadcast API route, after sending batch:

async function sendBatchAtomic(
  batch: Recipient[],
  emailContent: { subject: string; html: string }
) {
  const results: Array<{ email: string; success: boolean; error?: string }> = []
  
  // Send all emails in batch
  for (const recipient of batch) {
    try {
      await resend.emails.send({
        from: "...",
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
      results.push({ email: recipient.email, success: true })
    } catch (error) {
      results.push({
        email: recipient.email,
        success: false,
        error: (error as Error).message
      })
    }
  }
  
  // Record all results in single transaction
  const successCount = results.filter(r => r.success).length
  
  if (successCount > 0) {
    const { error } = await supabase.rpc('record_batch_send', {
      admin_id: userId,
      batch_size: successCount,
      success_emails: results.filter(r => r.success).map(r => r.email),
    })
    
    if (error) {
      console.error("[v0] Transaction error:", error)
      // In production: trigger alert/retry
    }
  }
  
  return results
}
```

**Benefit:** Ensures quota tracking stays in sync with actual sends

---

## Priority 3: User Experience Improvements

### 3.1 Add Progressive Sending Indicator

**Current Issue:** User sees loading spinner but doesn't know progress

**Recommended Frontend Improvement:**
```typescript
// In email-broadcast/page.tsx sendBroadcast()

const [sendProgress, setSendProgress] = useState<{
  total: number
  sent: number
  failed: number
}| null>(null)

// Use EventSource or WebSocket for real-time updates
const sendBroadcastWithProgress = async () => {
  // ... validation ...
  
  const eventSource = new EventSource(
    `/api/admin/send-broadcast-stream?broadcastId=${broadcastId}`
  )
  
  eventSource.addEventListener('progress', (event) => {
    const data = JSON.parse(event.data)
    setSendProgress({
      total: data.total,
      sent: data.sent,
      failed: data.failed,
    })
  })
  
  eventSource.addEventListener('complete', (event) => {
    const data = JSON.parse(event.data)
    toast.success(`Broadcast complete: ${data.sent} sent, ${data.failed} failed`)
    eventSource.close()
  })
  
  eventSource.addEventListener('error', () => {
    toast.error('Connection lost during send')
    eventSource.close()
  })
}

// In UI:
{sendProgress && (
  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-sm font-medium mb-2">
      Sending: {sendProgress.sent}/{sendProgress.total}
    </p>
    <div className="w-full bg-blue-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all"
        style={{
          width: `${(sendProgress.sent / sendProgress.total) * 100}%`
        }}
      />
    </div>
  </div>
)}
```

**Benefit:** Users know emails are being sent and see real-time progress

---

### 3.2 Add Estimated Time to Completion

**Current Issue:** User doesn't know how long send will take

**Recommended Improvement:**
```typescript
function calculateETC(
  totalRecipients: number,
  secondsPerEmail: number = 2
): { totalSeconds: number; display: string } {
  const totalSeconds = totalRecipients * secondsPerEmail
  
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  let display = ""
  if (minutes > 0) {
    display = `${minutes}m ${seconds}s`
  } else {
    display = `${Math.ceil(seconds)}s`
  }
  
  return { totalSeconds, display }
}

// In confirmation dialog:
const etc = calculateETC(selectedRecipients.size)
<AlertCircle className="w-4 h-4" />
<p className="text-sm text-amber-800">
  This will send emails to {selectedRecipients.size} recipients.
  Estimated time: {etc.display}. Please don't close this page.
</p>
```

**Benefit:** Users understand commitment before clicking send

---

### 3.3 Add "Test Send" Feature

**Current Issue:** No way to verify email format before sending to hundreds

**Recommended Implementation:**
```typescript
// Add button in UI for test send
<Button 
  variant="outline"
  onClick={() => handleTestSend()}
  disabled={!subject || !content}
>
  Send Test Email
</Button>

// In sendBroadcast logic:
async function handleTestSend() {
  // Send only to logged-in user's email
  const { data: { user } } = await supabase.auth.getUser()
  
  const response = await fetch("/api/admin/send-test-email", {
    method: "POST",
    body: JSON.stringify({
      to: user.email,
      subject,
      content,
    }),
  })
  
  if (response.ok) {
    toast.success(`Test email sent to ${user.email}`)
  } else {
    toast.error("Failed to send test email")
  }
}
```

**Benefit:** Admins can verify email before mass-sending

---

## Priority 4: Monitoring & Analytics

### 4.1 Add Prometheus Metrics

**Current Issue:** No visibility into broadcast health

**Recommended Implementation:**
```typescript
// lib/monitoring/email-metrics.ts
import { register, Counter, Histogram } from 'prom-client'

export const emailsSentCounter = new Counter({
  name: 'emails_sent_total',
  help: 'Total emails sent',
  labelNames: ['status'], // 'success', 'failed', 'queued'
})

export const emailSendDuration = new Histogram({
  name: 'email_send_duration_ms',
  help: 'Time to send email in milliseconds',
  buckets: [100, 500, 1000, 2000, 5000, 10000],
})

export const broadcastSize = new Histogram({
  name: 'broadcast_size',
  help: 'Number of recipients per broadcast',
  buckets: [1, 10, 50, 100, 500, 1000],
})

// Usage in send-broadcast:
emailsSentCounter.inc({ status: 'success' }, successCount)
emailsSentCounter.inc({ status: 'failed' }, failCount)
broadcastSize.observe(recipients.length)
emailSendDuration.observe(sendTimeMs)
```

**Benefit:** Track system health and identify trends

---

### 4.2 Add Structured Logging

**Current Issue:** Logs scattered across codebase, hard to search

**Recommended Improvement:**
```typescript
// lib/logging/structured-logger.ts
interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  service: 'email-broadcast'
  action: string
  userId?: string
  recipientCount?: number
  broadcastId?: string
  duration?: number
  error?: string
  [key: string]: any
}

export function logBroadcast(entry: Omit<LogEntry, 'timestamp'>) {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    service: 'email-broadcast',
    ...entry,
  }
  
  // Send to structured logging service (e.g., ELK, DataDog)
  console.log(JSON.stringify(logEntry))
  
  // Also send to monitoring service
  if (process.env.LOG_SERVICE_URL) {
    fetch(process.env.LOG_SERVICE_URL, {
      method: 'POST',
      body: JSON.stringify(logEntry),
    }).catch(err => console.error('Failed to send log:', err))
  }
}

// Usage:
logBroadcast({
  level: 'info',
  action: 'broadcast_started',
  userId: 'user123',
  recipientCount: 403,
  broadcastId: 'bc_456',
})
```

**Benefit:** Searchable, filterable logs for debugging

---

## Priority 5: Performance Optimizations

### 5.1 Implement Batch Email Sending

**Current Issue:** Sending 1 email at a time limits throughput

**Current Code:**
```typescript
const BATCH_SIZE = 1 // 1 email per request
```

**Recommended Improvement:**
```typescript
// Only batch if under rate limit:
// Resend free plan: 50/hour = 0.83/minute
// Our rate: 30/minute (safe margin)
// We could batch up to 5 emails per second (respecting rate limit)

const BATCH_SIZE = 5 // 5 emails per batch
const BATCH_DELAY_MS = 1000 // 1 second between batches = 300 emails/min

for (let i = 0; i < recipientsToSend.length; i += BATCH_SIZE) {
  const batch = recipientsToSend.slice(i, i + BATCH_SIZE)
  
  const batchPromises = batch.map(recipient =>
    sendEmailWithRetry(recipient.email, subject, htmlContent)
  )
  
  const results = await Promise.allSettled(batchPromises)
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++
    } else {
      failCount++
      errors.push(`${batch[index].email}: ${result.reason}`)
    }
  })
  
  // Delay between batches to respect rate limits
  if (i + BATCH_SIZE < recipientsToSend.length) {
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
  }
}
```

**Benefit:** 10x throughput increase (from 30/min to 300/min)

---

### 5.2 Add Caching for Recipient Lists

**Current Issue:** Fetching recipients on every broadcast attempt

**Recommended Implementation:**
```typescript
// lib/email/recipient-cache.ts
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 300 }) // 5 minute TTL

export async function getCachedRecipients(segment: string) {
  const cacheKey = `recipients:${segment}`
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log(`[v0] Cache hit for recipients:${segment}`)
    return cached as Recipient[]
  }
  
  // Fetch from database
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, first_name, last_name')
    .eq('status', 'active')
  
  if (!error && data) {
    cache.set(cacheKey, data)
    console.log(`[v0] Cached ${data.length} recipients for ${segment}`)
  }
  
  return data || []
}

// Invalidate cache after broadcast
export function invalidateRecipientCache(segment: string) {
  cache.del(`recipients:${segment}`)
}
```

**Benefit:** Faster recipient list loading, less database queries

---

## Testing Recommendations

### Unit Tests
```typescript
// __tests__/email-broadcast.test.ts
describe('Email Broadcast', () => {
  test('should validate required fields', () => {
    expect(() => sendBroadcast({})).toThrow('Missing required fields')
  })
  
  test('should calculate ETC correctly', () => {
    const etc = calculateETC(100, 2)
    expect(etc.totalSeconds).toBe(200)
    expect(etc.display).toBe('3m 20s')
  })
  
  test('should track quota correctly', async () => {
    const quota = await getTodayQuotaStatus('user123')
    expect(quota.daily_limit).toBe(100)
    expect(quota.sent_today).toBeLessThanOrEqual(100)
  })
})
```

### Integration Tests
```typescript
// __tests__/email-broadcast-integration.test.ts
describe('Email Broadcast Integration', () => {
  test('should send email via Resend', async () => {
    const result = await sendEmailWithRetry(
      'test@example.com',
      'Test Subject',
      '<p>Test</p>'
    )
    expect(result.id).toBeTruthy()
  })
  
  test('should queue large broadcasts', async () => {
    const response = await POST(createMockRequest({
      recipients: new Array(403).fill({}),
      subject: 'Test',
      content: 'Test',
    }))
    expect(response.status).toBe(202)
  })
})
```

---

## Summary

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| P1 | Validate config at startup | Critical | Low |
| P1 | Add retry logic | Critical | Medium |
| P1 | Fix footer text | Minor | Low |
| P2 | Webhook handling | High | High |
| P2 | Circuit breaker | High | Medium |
| P3 | Progress indicator | Medium | Medium |
| P3 | ETC calculation | Medium | Low |
| P3 | Test send | Medium | Low |
| P4 | Metrics | Low | Medium |
| P5 | Batch sending | Low | Medium |
| P5 | Caching | Low | Low |

**Recommended implementation order:** P1 → P3 → P2 → P5 → P4

This ensures critical issues are fixed first, then UX is improved, then reliability is enhanced.
