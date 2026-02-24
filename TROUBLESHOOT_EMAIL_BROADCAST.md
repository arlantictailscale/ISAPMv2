# Email Broadcast - Quick Troubleshooting Guide

## Issue: "Confirm & Send" Does Nothing

### Step 1: Check Browser Console (Most Important!)
1. Open DevTools: Press `F12` or Right-click → Inspect
2. Go to **Console** tab
3. Click "Confirm & Send" button
4. Look for logs starting with `[v0]`

**If you see `[v0] sendBroadcast called`:**
→ Go to **Step 2**

**If you see NO `[v0]` logs:**
→ JavaScript error before the function runs
→ Check for red error messages in console
→ Check if button is actually clickable
→ Try refreshing page and re-selecting recipients

---

### Step 2: Check Network Request
1. Go to **Network** tab in DevTools
2. Click "Confirm & Send" button
3. Look for a POST request to `/api/admin/send-broadcast`

**If request appears:**
- Check the **Status** column:
  - `200` → Go to **Step 3a** (Success but something else wrong)
  - `202` → Go to **Step 3b** (Queued - normal for large broadcasts)
  - `400` → Go to **Step 4a** (Bad request)
  - `401` → Go to **Step 4b** (Authentication error)
  - `403` → Go to **Step 4c** (Permission error)
  - `500` → Go to **Step 4d** (Server error)

**If request does NOT appear:**
- Function is failing before sending request
- Check console for errors
- Verify you're logged in
- Try clearing browser cache and reload

---

### Step 3a: Status 200 but Emails Not Sent

**Diagnosis:** API says success but emails didn't arrive

**Quick Checks:**
1. Check recipient email addresses are correct
   - In the recipients list, verify email format
   - Look for typos or test emails

2. Check email spam folder
   - Emails might be filtered as spam

3. Wait a few seconds
   - Sending takes time (2+ seconds per email)
   - For 403 recipients: ~13 minutes to send all

4. Check Resend dashboard
   - Go to https://resend.com
   - Check "Logs" for failed deliveries
   - Check if account has credits

**If still nothing:**
- Emails may have been queued (202 response)
- Check history tab - does it show as "queued"?
- Check back tomorrow at 00:00 UTC

---

### Step 3b: Status 202 - This Is Normal!

**Meaning:** Your broadcast was queued for later

**Why this happens:**
- Resend free plan: 100 emails per day limit
- You tried to send more than 100 emails at once
- System automatically queues excess emails for tomorrow

**What to expect:**
- Some emails sent today (up to remaining daily limit)
- Rest queued and sent tomorrow at 00:00 UTC
- Toast shows: "X emails queued for tomorrow"

**This is the correct behavior** - the system is protecting you from exceeding daily limits!

**To verify it worked:**
1. Check quota display - should show: "X / 100" (higher number)
2. Check email history tab - broadcast should be listed
3. Tomorrow at 00:00 UTC - remaining emails will send automatically

---

### Step 4a: Status 400 - Bad Request

**Meaning:** Your request is missing required fields

**Quick Fixes:**
1. Verify you entered:
   - ✓ Email subject (not empty)
   - ✓ Email content/message (not empty)
   - ✓ Selected at least 1 recipient

2. Check subject and content:
   - No special characters causing issues
   - Content is actual text (not blank spaces)

3. Try sending to fewer recipients:
   - Select only 1 recipient
   - Verify it works before trying large broadcasts

**If still failing:**
- Refresh page completely (Ctrl+F5 or Cmd+Shift+R)
- Try in incognito/private window
- Clear browser cache

---

### Step 4b: Status 401 - Unauthorized

**Meaning:** Your session expired or is invalid

**Quick Fixes:**
1. Log out and log back in
   - Click your profile icon
   - Click "Sign Out"
   - Log back in

2. Try in a private/incognito window
   - May be a browser cookie issue

3. Clear browser cookies for this site
   - Right-click → Inspect
   - Go to Application → Cookies
   - Delete all cookies for `isapm2026.org`
   - Refresh and log in again

**If still failing:**
- Your account access may have been revoked
- Contact admin to verify your permissions

---

### Step 4c: Status 403 - Forbidden

**Meaning:** Your user account doesn't have admin permission

**Likely Causes:**
- Your role was changed from admin to user
- Your account was demoted

**Fix:**
- Contact the site administrator
- Ask them to verify your account has `role = 'admin'`
- They may need to manually update your permissions in database

---

### Step 4d: Status 500 - Server Error

**Meaning:** Something went wrong on the server side

**Most Common Cause:** Missing `RESEND_API_KEY` environment variable

**Quick Fixes:**
1. Check server is running
   - Can you access the main website?
   - Or does it show error page?

2. For site administrators:
   - Verify `RESEND_API_KEY` is set in environment variables
   - Verify key is valid (not expired or revoked)
   - Check server logs for error message
   - Restart server after adding missing variables

3. If you can't access website at all:
   - Server may be down
   - Wait a few minutes and try again
   - Contact hosting support if down for >5 minutes

**To get full error details:**
- Check server logs (ask administrator)
- Look for error messages with `[v0]` prefix
- Share full error message with development team

---

## Complete Checklist - Step Through in Order

### Before Sending
- [ ] You are logged in as an admin user
- [ ] Subject field has text (not empty)
- [ ] Content field has text (not empty)
- [ ] At least 1 recipient is selected
- [ ] Browser DevTools console shows no errors
- [ ] Network tab is open to watch request

### During Send
- [ ] DevTools console shows `[v0] sendBroadcast called`
- [ ] Network request to `/api/admin/send-broadcast` appears
- [ ] Wait for response (may take seconds to minutes depending on recipient count)

### After Send
- [ ] Status code is 200 or 202 (not 4xx or 5xx)
- [ ] Success toast appears (green notification)
- [ ] Quota counter updated
- [ ] Form cleared automatically

### Email Verification
- [ ] Check sender inbox/spam folder
- [ ] Wait 5-10 seconds for email delivery
- [ ] Check all recipient inboxes
- [ ] Verify email content is correct
- [ ] If not arriving: check Resend dashboard logs

---

## Emergency Support Info

**When contacting support, include:**

1. Screenshot of the error (if any)
2. Console logs (copy-paste the `[v0]` messages)
3. Network response status and body
4. Number of recipients
5. When you tried to send
6. Browser and OS version

**To save console logs:**
1. Right-click in console
2. Select "Save as..." 
3. Share the .html file

**To export network response:**
1. Right-click the `/api/admin/send-broadcast` request
2. Select "Copy Response"
3. Paste into support message

---

## Success Indicators

You'll know it's working when:
✓ Console shows: `[v0] Broadcast completed: X sent`
✓ Network status: 200 (or 202 for queued)
✓ Green toast: "Broadcast sent to X recipients!"
✓ Emails arrive in inboxes within 5-10 seconds
✓ Quota display updates (shows X/100)
✓ Form clears automatically

---

## Common Mistakes to Avoid

❌ Selecting 0 recipients then clicking send
→ Will show error "Please select at least one recipient"

❌ Leaving subject or content blank
→ Will show error "Please fill in subject and content"

❌ Closing the modal before send completes
→ May interrupt the send process
→ Wait for success message before closing

❌ Sending large broadcasts (>100) and expecting instant delivery
→ They are queued over multiple days
→ This is normal for free plan

❌ Testing with same email address multiple times
→ May end up in spam if email server rejects duplicates
→ Use different test emails for each attempt

❌ Not waiting for network response
→ Page may show "loading" for several minutes
→ Don't refresh or leave page until complete

---

## Performance Expectations

- **Single recipient:** 2-5 seconds
- **10 recipients:** 20-25 seconds  
- **50 recipients:** 100-110 seconds (~2 minutes)
- **100 recipients:** 200+ seconds (~3-4 minutes)
- **403 recipients:** 
  - 50 sent immediately (~100 sec)
  - 353 queued (sent tomorrow)

If taking longer than expected, it's probably:
1. Network is slow
2. Server is busy
3. Resend service is experiencing delays

**DO NOT refresh or close page while sending!**
