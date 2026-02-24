# Email Queue Processor Setup Guide

This guide explains how to set up the background job processor for queued email broadcasts to handle Resend Free Plan rate limiting.

## Overview

The system now supports:
- **Daily Quota Tracking**: 100 emails/day limit for Resend Free Plan
- **Automatic Queuing**: Broadcasts exceeding daily quota are automatically queued
- **Background Processing**: Queued emails are processed respecting rate limits
- **Rate Limiting**: 1 email every 2 seconds = 30/min (safe for 50/hour limit)

## Database Tables

Three new tables were created:

1. **email_send_logs**: Track daily email send counts per admin
   - `admin_id`, `date`, `sent_count`, `last_reset`

2. **email_broadcasts**: Store broadcast campaigns
   - `admin_id`, `subject`, `content`, `segment`, `total_recipients`, `status`, `scheduled_for`

3. **broadcast_recipients**: Store individual recipient delivery status
   - `broadcast_id`, `user_id`, `email`, `status`, `sent_at`, `error_message`

## API Endpoints

### 1. `/api/admin/quota-status` (GET)
Get current daily email quota status for the logged-in admin.

**Response:**
```json
{
  "quota": {
    "sent_today": 45,
    "remaining_today": 55,
    "daily_limit": 100,
    "reset_time": "2026-02-23T00:00:00Z",
    "can_send": true,
    "is_over_quota": false
  }
}
```

### 2. `/api/admin/send-broadcast` (POST)
Send broadcast emails with automatic queuing for excess recipients.

**Key Features:**
- Sends up to daily quota immediately
- Automatically queues remaining emails for tomorrow
- Detects and handles Resend 429 rate limit responses
- Implements exponential backoff on rate limit errors

**Response:**
```json
{
  "success": true,
  "message": "Broadcast sent to 50 recipients! 353 emails queued for tomorrow.",
  "stats": {
    "total": 403,
    "sent": 50,
    "failed": 0,
    "queued": 353
  },
  "quota_status": {
    "used_today": 100,
    "limit": 100,
    "remaining": 0,
    "needs_queue": true
  }
}
```

### 3. `/api/admin/queue-broadcast` (POST)
Manually queue a broadcast for later sending.

**Request:**
```json
{
  "subject": "Event Reminder",
  "content": "Dear {{name}}, ...",
  "recipients": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "first_name": "John",
      "last_name": "Doe"
    }
  ],
  "segment": "all",
  "scheduled_for": "2026-02-23T08:00:00Z"
}
```

### 4. `/api/admin/process-queue` (GET)
**Process queued broadcasts** - Call this periodically to send queued emails.

**Authentication:** Requires `x-admin-api-key` header with value of `ADMIN_API_KEY` environment variable.

**Query Parameters:**
- `limit` (optional): Number of broadcasts to process per call (default: 50)

**Example:**
```bash
curl -H "x-admin-api-key: your-secret-key" \
  https://your-app.com/api/admin/process-queue?limit=30
```

## Setting Up Background Processing

### Option 1: Vercel Crons (Recommended)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/process-queue?limit=30",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

This runs the queue processor every hour.

### Option 2: External Cron Service (e.g., EasyCron, AWS EventBridge)

Set up a cron job to call:
```
GET https://your-app.com/api/admin/process-queue?limit=30
Header: x-admin-api-key: <your-secret-key>
```

Schedule: Every 1-2 hours

### Option 3: Deploy a Worker (e.g., Node-cron, APScheduler)

Create a separate worker that calls the endpoint periodically:

```javascript
// worker.js
const schedule = require('node-cron');

schedule.scheduleJob('0 * * * *', async () => {
  console.log('Processing queued broadcasts...');
  const response = await fetch(
    'https://your-app.com/api/admin/process-queue',
    {
      headers: {
        'x-admin-api-key': process.env.ADMIN_API_KEY
      }
    }
  );
  console.log(await response.json());
});
```

## Environment Variables

Add these to your `.env.local`:

```env
ADMIN_API_KEY=your-secret-api-key-for-cron-jobs
NEXT_PUBLIC_BASE_URL=https://your-app.com
```

The `ADMIN_API_KEY` is used to authenticate cron job requests to `/api/admin/process-queue`.

## How It Works

### When Broadcasting 403 Emails on Free Plan

1. **User clicks "Send to 403 Recipients"**
   - System checks daily quota
   - Quota Status: 0/100 available today

2. **First 100 emails are sent immediately**
   - Rate limited: 1 email per 2 seconds
   - Takes ~3.3 minutes
   - Success: 100 sent, 0 queued

3. **Remaining 303 emails are queued**
   - Stored in `email_broadcasts` and `broadcast_recipients` tables
   - Status: "queued"
   - Next day's quota reset at 00:00 UTC

4. **Background processor runs (hourly via cron)**
   - Checks for queued broadcasts
   - Sends next batch respecting daily limits
   - Day 1: 100 sent
   - Day 2: 100 sent
   - Day 3: 100 sent
   - Day 4: 3 sent (remaining)

## Monitoring Queued Broadcasts

### View Queued Broadcasts

**GET** `/api/admin/queue-broadcast`

Returns all queued, in-progress, and scheduled broadcasts for the logged-in admin.

### Manual Queue Status Check

In the admin panel, the quota warning will show:
- "Only 50 emails remaining today"
- "103 emails will be queued for tomorrow"

## Rate Limiting Details

**Resend Free Plan Limits:**
- 100 emails/day
- 50 emails/hour
- Implementation: 1 email every 2 seconds = 30 emails/minute (safe buffer)

**Handling 429 (Too Many Requests):**
- If Resend returns 429, system implements exponential backoff
- Wait time doubles each retry (1s → 2s → 4s → ... max 30s)
- Retries up to 2 times before marking email as failed

## Troubleshooting

### Queue processor not running?

1. Check `ADMIN_API_KEY` is set correctly
2. Verify cron job is enabled in Vercel dashboard
3. Check `/api/admin/process-queue` logs for errors
4. Test manually:
   ```bash
   curl -H "x-admin-api-key: test-key" \
     http://localhost:3000/api/admin/process-queue?limit=10
   ```

### Emails not sending from queue?

1. Check `email_broadcasts` table for queued records
2. Check `broadcast_recipients` for "pending" status
3. Review API logs for rate limit (429) errors
4. Ensure Resend API key is valid

### Quota not resetting?

Daily quota resets at 00:00 UTC. If quota shows as exceeded:
1. Check `email_send_logs` table for today's date
2. Verify date is in format: "YYYY-MM-DD"
3. Manually update if needed:
   ```sql
   UPDATE email_send_logs 
   SET sent_count = 0 
   WHERE DATE(date) = CURRENT_DATE;
   ```

## Testing

### Test Quota System

1. Send 50 emails (should succeed)
2. Send 60 emails (50 sent, 10 queued)
3. Check quota displays "50/100 used, 50 remaining"
4. Wait 1 second and check again (simulates next hour)
5. Send 70 more (should queue all 70)

### Test Queue Processor

1. Queue a broadcast manually via API
2. Call `/api/admin/process-queue` endpoint
3. Check `broadcast_recipients` status changed from "pending" to "sent"
4. Verify daily send count increased

## Production Checklist

- [ ] `ADMIN_API_KEY` environment variable set
- [ ] `NEXT_PUBLIC_BASE_URL` matches deployment URL
- [ ] Vercel crons configured or external cron job set up
- [ ] Database migrations executed
- [ ] Tested with 100+ email broadcast
- [ ] Tested queue processor runs successfully
- [ ] Monitored first few automatic queue runs
- [ ] Email templates configured for all segments
