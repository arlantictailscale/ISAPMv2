# Email Confirmation Setup Guide (Updated)

This guide explains how to configure Supabase email confirmation to work with the ISAPM 2026 website.

## The Problem

Supabase email confirmation can fail with "Error confirming user" for several reasons:
1. Using client-side handling for server-side tokens
2. Incorrect email template configuration
3. Missing redirect URL configuration

## The Solution

We use a **server-side API route** (`/api/auth/confirm`) that handles the `token_hash` verification directly with Supabase.

## Setup Steps

### Step 1: Configure Supabase URL Settings

Go to **Supabase Dashboard → Authentication → URL Configuration**:

1. **Site URL**: `https://isapm2026.org`
2. **Redirect URLs** (add all of these):
   - `https://isapm2026.org/api/auth/confirm`
   - `https://isapm2026.org/auth/callback`
   - `https://isapm2026.org/auth/email-confirmed`
   - `https://isapm2026.org/dashboard`

### Step 2: Update Email Template

Go to **Supabase Dashboard → Authentication → Email Templates → Confirm signup**

Replace the template with the contents of `supabase-email-templates/confirm-signup-v2.html`.

**Key points about the template:**
- Uses `{{ .SiteURL }}` for the base URL
- Uses `{{ .TokenHash }}` for the verification token
- Points to `/api/auth/confirm` (server-side endpoint)
- Includes `type=signup` parameter
- Includes `next=/auth/email-confirmed` for redirect after success

### Step 3: Verify Environment Variables

Ensure these are set in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

## How It Works

1. User clicks "Confirm Your Email" button in email
2. Browser navigates to: `https://isapm2026.org/api/auth/confirm?token_hash=xxx&type=signup&next=/auth/email-confirmed`
3. Server-side route (`/api/auth/confirm`) calls `supabase.auth.verifyOtp({ token_hash, type })`
4. Supabase verifies the token and creates a session
5. User is redirected to `/auth/email-confirmed` with an active session

## Troubleshooting

### "Invalid confirmation link" error
- The token may have expired (24 hour limit)
- The token may have already been used
- Ask user to request a new confirmation email

### "Error confirming user" error  
- Check that the email template uses `{{ .TokenHash }}` not `{{ .Token }}`
- Verify the Site URL is correct in Supabase settings
- Check server logs for detailed error messages

### User not redirected properly
- Verify all redirect URLs are added in Supabase settings
- Check that the `next` parameter is being passed correctly

## Testing

1. Create a new account at `/auth/sign-up`
2. Check email for confirmation link
3. Click the link - should redirect to `/auth/email-confirmed`
4. User should now be logged in with verified email
