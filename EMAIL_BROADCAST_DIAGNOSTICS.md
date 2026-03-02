# Email Broadcast Feature - Comprehensive Diagnostic Report & Troubleshooting Guide

## Issue Summary

**Reported Problem:** After clicking "Confirm & Send" button in the email broadcast confirmation modal, no emails are sent - neither to single users nor to multiple recipients. Previously, single-recipient sending worked but multiple recipients failed.

**Current Status:** Complete breakdown of the sending functionality after recent updates.

---

## Root Cause Analysis

Based on code review, the issue appears to be one or more of the following:

### 1. **Frontend-to-Backend Communication Failure**
- **Symptom:** User clicks "Confirm & Send" and UI shows loading state, but no network request is made to the API
- **Likely Cause:** 
  - The `sendBroadcast()` function may be throwing an error before the fetch request
  - Authentication check failing (`session` is null)
  - Request is being aborted due to timeout or signal error
  - Error is caught silently without proper logging

### 2. **API Endpoint Not Responding**
- **Symptom:** Network request reaches API but returns an error status code
- **Likely Cause:**
  - Admin authorization check failing (user role !== "admin")
  - Missing/invalid environment variable `RESEND_API_KEY`
  - Quota manager functions throwing unhandled exceptions
  - Request payload validation failing

### 3. **Email Service Integration Broken**
- **Symptom:** API processes request but emails don't send via Resend
- **Likely Cause:**
  - Invalid or expired `RESEND_API_KEY` in environment
  - Resend service outage or rate limiting
  - HTML email generation failing  
  - Recipient email addresses invalid or improperly formatted

### 4. **Rate Limiting/Quota System Blocking Sends**
- **Symptom:** API returns 202 (Accepted) or 429 (Too Many Requests) instead of sending
- **Likely Cause:**
  - Daily quota (100 emails) already exhausted
  - `shouldQueueBroadcast()` returning true due to recipient count > daily limit
  - `getTodayQuotaStatus()` not properly tracking previous sends

---

## Current Implementation Flow

### Frontend (email-broadcast/page.tsx)

```
User clicks "Send to X Recipients" button
  ↓
showConfirmDialog = true (opens modal)
  ↓
User clicks "Confirm & Send" button
  ↓
sendBroadcast() called
  ↓
Validation checks (subject, content, recipients)
  ↓
Get auth session
  ↓
Fetch POST /api/admin/send-broadcast
  ↓
Handle response (202, success, error)
  ↓
Show toast notification
  ↓
Reset form / Update UI
```

### Backend (api/admin/send-broadcast/route.ts)

```
POST request received
  ↓
Check RESEND_API_KEY exists
  ↓
Create Supabase client
  ↓
Verify user authentication
  ↓
Check user is admin (profile.role === "admin")
  ↓
Parse request body
  ↓
Validate fields (subject, content, recipients)
  ↓
Get daily quota status
  ↓
Check if should queue (recipients > daily remaining)
  ↓
Check if scheduled (save to DB for later)
  ↓
Send emails in batches (1 per 2 seconds for rate limiting)
  ↓
Record emails sent to quota
  ↓
Return success response
```

---

## Detailed Troubleshooting Checklist

### Phase 1: Environment & Configuration
- [ ] Verify `RESEND_API_KEY` is set in `.env.local` and valid
- [ ] Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- [ ] Check that authenticated user has `role = 'admin'` in `profiles` table
- [ ] Verify user session is valid (not expired)

### Phase 2: Frontend Diagnostics
- [ ] Open browser DevTools → Console
- [ ] Look for `[v0]` console logs when clicking "Confirm & Send"
  - Should see: `"sendBroadcast called"`
  - Should see: `"Session: exists"`
  - Should see: `"Recipient count: X"`
  - Should see: `"Sending request to API..."`
  
- [ ] Open DevTools → Network tab
  - Click "Confirm & Send"
  - Look for POST request to `/api/admin/send-broadcast`
  - If request doesn't appear: Function is failing before fetch
  - If request appears:
    - Check response status (200, 202, 4xx, 5xx)
    - Check response body for error message

### Phase 3: API Diagnostics
- [ ] Check server logs for `[v0]` entries:
  - "Email broadcast API called" - confirms route is reached
  - "RESEND_API_KEY is not configured" - missing env var
  - "No user found - unauthorized" - auth failure
  - "User is not admin" - authorization failure
  - "Recipients: X" - request parsing successful
  - "Broadcast completed: X sent" - emails were sent

- [ ] Check if responses are returning correct status codes:
  - 200 - Success (emails sent)
  - 202 - Queued (broadcast too large, will send over multiple days)
  - 400 - Bad request (missing fields)
  - 401 - Unauthorized (session invalid)
  - 403 - Forbidden (user not admin)
  - 429 - Quota exhausted (daily limit reached)
  - 500 - Server error (exception thrown)

### Phase 4: Email Service Diagnostics
- [ ] Log in to Resend dashboard
  - Check email logs to see if any emails were attempted
  - Check for API key validity
  - Check account status (active, not suspended)
  - Review rate limit settings

- [ ] Test with single recipient first
  - Send to 1 user
  - Verify email arrives in inbox
  - Check spam folder
  - Check Resend logs for delivery status

- [ ] Test with small batch
  - Send to 5-10 users
  - Verify all emails arrive
  - Check delivery time (should be 2-3 seconds each due to rate limiting)

### Phase 5: Quota System Diagnostics
- [ ] Check `email_send_logs` table
  - Query: `SELECT * FROM email_send_logs WHERE admin_id = 'USER_ID' AND send_date = CURRENT_DATE`
  - Verify count matches emails already sent today
  - Verify no stale entries from previous days

- [ ] Check `email_broadcasts` table (if broadcasts are being queued)
  - Query: `SELECT * FROM email_broadcasts WHERE created_by = 'USER_ID' ORDER BY created_at DESC`
  - Verify status field shows correct state

- [ ] Check `broadcast_recipients` table for queued emails
  - Query: `SELECT * FROM broadcast_recipients WHERE broadcast_id = 'BROADCAST_ID' AND status = 'pending'`
  - Verify recipients are properly stored for delayed sending

---

## Possible Failure Scenarios & Fixes

### Scenario A: "Nothing Happens" (Complete Silent Failure)
**Indication:** No console logs, no network request, no error message

**Likely Causes:**
1. `sendBroadcast()` throws error before logging
2. Exception in `supabase.auth.getSession()` call
3. `selectedRecipients` Set is empty despite UI showing count
4. Component state is out of sync with actual recipients

**Fix:**
```typescript
// Add more detailed error catching in sendBroadcast()
try {
  console.log("[v0] sendBroadcast called")
  console.log("[v0] selectedRecipients.size:", selectedRecipients.size)
  console.log("[v0] recipientList length:", filteredRecipients.filter(r => selectedRecipients.has(r.id)).length)
  
  if (!subject.trim() || !content.trim()) {
    console.log("[v0] Validation failed: missing subject or content")
    toast.error("Please fill in subject and content")
    return
  }
  // ... rest of function
} catch (err) {
  console.error("[v0] UNEXPECTED ERROR IN sendBroadcast:", err)
  // Log the full stack trace
  if (err instanceof Error) {
    console.error("[v0] Stack:", err.stack)
  }
}
```

### Scenario B: API Doesn't Respond (404 or Connection Error)
**Indication:** Network tab shows no request, or request fails to connect

**Likely Causes:**
1. API route file not properly exported
2. Wrong endpoint URL in fetch call
3. Route file syntax error preventing deployment
4. API requires authentication headers that aren't being sent

**Fix:**
- Verify file exists at `/app/api/admin/send-broadcast/route.ts`
- Verify export: `export async function POST(request: NextRequest)`
- Verify fetch URL matches: `/api/admin/send-broadcast`
- Verify Authorization header has correct format: `Bearer ${access_token}`

### Scenario C: 401 Unauthorized
**Indication:** API returns 401 with error "Unauthorized"

**Likely Causes:**
1. Session expired or invalid
2. Access token not being passed correctly
3. `createClient()` server-side function failing to authenticate

**Fix:**
```typescript
// In sendBroadcast(), add explicit session validation:
const { data: { session } } = await supabase.auth.getSession()
if (!session || !session.access_token) {
  console.error("[v0] Session or token missing:", { session: !!session, token: !!session?.access_token })
  toast.error("Your session has expired. Please log in again.")
  // Redirect to login
  return
}
```

### Scenario D: 403 Forbidden
**Indication:** API returns 403 with error "Forbidden"

**Likely Causes:**
1. User doesn't have `role = 'admin'` in profiles table
2. Profile record doesn't exist for user
3. RLS policy blocking admin role query

**Fix:**
- Verify in Supabase dashboard:
  - User exists in auth.users table
  - User has corresponding row in profiles table
  - profiles.role is set to 'admin' (not null, not 'user')
  - RLS policies allow admin queries

### Scenario E: API Returns 500 (Server Error)
**Indication:** API returns 500 with error message

**Likely Causes:**
1. RESEND_API_KEY not set (most common)
2. `getTodayQuotaStatus()` or `shouldQueueBroadcast()` throws exception
3. `recordEmailsSent()` fails due to RLS policy
4. Email HTML generation throws error

**Fix:**
- Check server logs for full error stack trace
- Verify all environment variables are set:
  - `RESEND_API_KEY` (critical)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

### Scenario F: API Returns 202 (Queued Instead of Sent)
**Indication:** Toast says "Broadcast queued..." instead of "Broadcast sent..."

**Causes:**
1. Broadcast size (e.g., 403 recipients) exceeds today's remaining quota
2. `shouldQueueBroadcast()` returns true
3. Daily quota already partially used

**Expected Behavior:**
- This is actually correct behavior for Resend free plan (100 emails/day limit)
- Broadcasts > remaining quota are queued for next day
- Excess emails are auto-sent at ~1-2 per minute (respecting 50/hour limit)
- User should see message: "403 emails will be sent over 4 days"

**User Expectation vs Reality:**
- User expects all 403 emails to send immediately
- System intentionally queues them to respect Resend free plan limits
- This is a feature, not a bug (ensures compliance with rate limits)

---

## Testing Strategy

### Test 1: Single Recipient, Immediate Send
```
Setup:
- Logged in as admin user
- Daily quota: 0/100
- 1 recipient selected
- Subject: "Test Email"
- Content: "Test content"

Action:
- Click "Send to 1 Recipients"
- Click "Confirm & Send"

Expected:
- ✓ Loading spinner appears
- ✓ "[v0] sendBroadcast called" in console
- ✓ POST request appears in Network tab
- ✓ Response status 200
- ✓ Toast: "Broadcast sent to 1 recipients!"
- ✓ Email arrives in recipient's inbox within 5 seconds
- ✓ Quota updates to 1/100
```

### Test 2: Multiple Recipients, Within Daily Quota
```
Setup:
- Logged in as admin user
- Daily quota: 0/100
- 50 recipients selected
- Subject: "Test Broadcast"
- Content: "Test content"

Action:
- Click "Send to 50 Recipients"
- Click "Confirm & Send"

Expected:
- ✓ Loading spinner appears and persists
- ✓ Network request to API
- ✓ Emails sent sequentially (2 second delay between each)
- ✓ Total send time: ~100 seconds (50 emails × 2 sec)
- ✓ Toast: "Broadcast sent to 50 recipients!"
- ✓ Quota updates to 50/100
- ✓ All 50 emails arrive in inboxes
```

### Test 3: Multiple Recipients, Exceeds Daily Quota
```
Setup:
- Logged in as admin user
- Daily quota: 50/100 (50 already sent)
- 403 recipients selected
- Subject: "Large Broadcast"
- Content: "Test content"

Action:
- Click "Send to 403 Recipients"
- Note warning: "This will send emails to 403 recipients..."

Expected:
- ✓ API returns 202 (Accepted)
- ✓ Toast: "Broadcast queued - 50 sent today, 353 queued for tomorrow"
- ✓ Remaining 50 emails sent today (within 100/day limit)
- ✓ Remaining 353 emails queued in database
- ✓ Next day at 00:00 UTC: queued emails automatically sent

---

## Performance Metrics

### Single Recipient
- Time to send: 2-3 seconds
- Email delivery time: <1 second after API response

### 50 Recipients  
- API processing time: ~100 seconds (1 email per 2 seconds)
- Network timeout: 120 seconds (sufficient)
- Expected result: All emails delivered

### 403 Recipients (Free Plan)
- Immediate sends: 50 (to use remaining daily quota)
- Time: ~100 seconds
- Remaining: 353 queued for next day
- Next day delivery: Automated via background processor

---

## Common Mistakes & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Button doesn't respond | `onClick` not connected | Verify `onClick={sendBroadcast}` on button |
| Dialog doesn't open | `showConfirmDialog` state issue | Add console.log to verify state changes |
| Recipients show "0/0" | Recipient fetching failed | Check `loadRecipients()` and API response |
| Button stays disabled | `isSending` never set to false | Check error handling in catch block |
| Toast doesn't appear | Toast component not mounted | Verify `<Toaster />` in layout |
| Network request hangs | Timeout too short | Increase to 120000ms (2 minutes) |
| Emails never arrive | RESEND_API_KEY invalid | Regenerate key in Resend dashboard |

---

## Next Steps for Users

1. **First:** Open browser console (F12) and check for `[v0]` logs when clicking send
2. **Second:** Open Network tab and verify POST request is being made
3. **Third:** Check the response status and body for error details
4. **Fourth:** Provide server logs showing `[v0]` entries
5. **Fifth:** Verify Resend API key is valid and account has available quota

---

## For Developers: Code Quality Issues Found

1. **Missing environment variable validation** - Should fail at startup if `RESEND_API_KEY` missing
2. **Insufficient error context** - 500 errors don't always include root cause
3. **Hard-coded footer text** - Email footer still says "The Singhasari Resort" instead of "Hotel"
4. **Missing analytics** - No tracking of send failures by error type
5. **Timeout brittle** - 120 second timeout assumes sequential email sending - should be adaptive

---

## Success Indicators

When working correctly, you should see:
- ✓ Console logs flow from "sendBroadcast called" to "Setting isSending to false"
- ✓ Network request completes in <120 seconds
- ✓ Status code 200 or 202
- ✓ Toast notification appears
- ✓ Emails arrive in recipient inboxes
- ✓ Quota counter updates
- ✓ Form resets for next broadcast
