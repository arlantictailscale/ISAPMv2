# Email Broadcast - Quick Reference Card

## Problem: "Confirm & Send" Does Nothing

### 30-Second Fix Attempt
1. Log out completely
2. Log back in
3. Try sending again

If that doesn't work → Continue below

---

## 3-Minute Diagnostic

### Step 1: Open DevTools
- Press `F12` or Right-click → Inspect
- Go to **Console** tab

### Step 2: Try Send Again
- Click "Confirm & Send"
- Look for errors or logs

### Step 3: Check Results

**You see `[v0] sendBroadcast called`?**
→ Go to Network tab, click "Confirm & Send" again, check request status

**You see red ERROR?**
→ Take screenshot and contact support

**You see NOTHING?**
→ Function isn't running. Try clearing cache: Ctrl+Shift+Delete

---

## Network Request Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success ✓ | Check emails arrive in 5-10 sec |
| 202 | Queued (normal) ✓ | Emails sending over multiple days |
| 400 | Bad request | Check: subject filled? content filled? recipients selected? |
| 401 | Session expired | Log out → Log back in |
| 403 | Not admin | Contact site admin for permission |
| 500 | Server error | Check environment variables set |
| Pending | Still processing | Wait (up to 3 minutes for large broadcasts) |
| None | Not sent | Check console for errors, clear cache |

---

## Email Not Arriving? (Status 200 but No Email)

### Quick Checks
- [ ] Wait 10+ seconds (delivery takes time)
- [ ] Check spam/junk folder
- [ ] Check email typed correctly in recipients list
- [ ] Check sent to right mailbox (multiple accounts?)
- [ ] Try sending to yourself first (test)

### Still Not There?
1. Go to https://resend.com (Resend email dashboard)
2. Sign in
3. Look at "Logs"
4. Search for recipient email
5. Check "Status" (delivered? bounced? failed?)

---

## Error Messages & Fixes

### "Session expired"
**Fix:** Log out → Log back in

### "Please select at least one recipient"
**Fix:** Click recipients list, select at least 1 person

### "Please fill in subject and content"
**Fix:** Type something in both Subject and Content boxes

### "Email service not configured"
**Fix:** Site admin needs to set `RESEND_API_KEY` environment variable

### "Request timed out"
**Fix:** 
- For large broadcasts (100+ recipients), wait up to 3 minutes
- For small broadcasts, your network might be slow
- Try again - temporary network issues are common

### "Forbidden"
**Fix:** Contact site admin - your account doesn't have broadcast permission

---

## Performance Expectations

- **1 recipient:** 2-5 seconds
- **10 recipients:** 20-25 seconds
- **50 recipients:** 1-2 minutes
- **100 recipients:** 3-4 minutes
- **400+ recipients:** 
  - First 100: 1-2 minutes
  - Rest: Auto-send tomorrow at 00:00 UTC

**DO NOT refresh page or close modal while sending!**

---

## Success Indicators

✓ Loading spinner on button
✓ "[v0] sendBroadcast called" in console  
✓ POST request appears in Network tab
✓ Status code 200 or 202
✓ Green toast notification appears
✓ Form clears automatically
✓ Quota updates
✓ Emails arrive in inboxes

If all of above: **It worked!** ✓

---

## Escalation Steps

1. **Can't solve in 5 minutes?**
   - Take screenshots of DevTools (Console + Network)
   - Note the exact error message
   - Contact site administrator

2. **Admin still can't solve?**
   - Check EMAIL_BROADCAST_DIAGNOSTICS.md for detailed troubleshooting
   - Verify all environment variables are set:
     - RESEND_API_KEY ✓
     - NEXT_PUBLIC_SUPABASE_URL ✓
     - SUPABASE_SERVICE_ROLE_KEY ✓
   - Check server logs for `[v0]` entries
   - Contact development team with logs

3. **Still stuck?**
   - Read full analysis: EMAIL_BROADCAST_ISSUE_ANALYSIS.md
   - Share findings with development team
   - Implement improvements from EMAIL_BROADCAST_IMPROVEMENTS.md

---

## Key Files

- **TROUBLESHOOT_EMAIL_BROADCAST.md** - Step-by-step guide
- **EMAIL_BROADCAST_DIAGNOSTICS.md** - Technical deep-dive
- **EMAIL_BROADCAST_ISSUE_ANALYSIS.md** - Complete analysis
- **EMAIL_BROADCAST_IMPROVEMENTS.md** - Code improvements

---

## Cheat Sheet: Copy-Paste Useful Info

### For Console to Test
```javascript
// Check if session exists
await supabase.auth.getSession()

// Check if you're admin
await supabase.from('profiles').select('role').single()

// Manually test API
fetch('/api/admin/send-broadcast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Test',
    content: 'Test',
    recipients: [{ id: '1', email: 'test@example.com' }]
  })
})
```

### Environment Variables to Set
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

## Contact Info (Update with your details)

- **Email Support:** admin@isapm2026.org
- **WhatsApp:** +6289602626709
- **Site Admin:** [Contact in-site]
- **Developer:** [Contact in-site]

---

## One-Minute Summary

**Problem:** "Confirm & Send" button does nothing

**Most Likely Fix:** 
1. Open DevTools (F12)
2. Check console for errors
3. Try sending again
4. Check Network tab for request status

**If still broken:**
→ Check EMAIL_BROADCAST_ISSUE_ANALYSIS.md for detailed troubleshooting

**Time to resolve:** Usually <5 minutes with DevTools investigation
