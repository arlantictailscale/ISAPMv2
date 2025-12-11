# Email Confirmation Setup Guide

## Overview

This guide explains how to set up email confirmation for user registration in Supabase.

## Prerequisites

- Supabase project connected to your v0 workspace
- Database trigger `handle_new_user` already deployed (from `scripts/012-fix-handle-new-user-trigger.sql`)

## Step 1: Configure Supabase URL Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication → URL Configuration**
3. Set the following:
   - **Site URL**: `https://isapm2026.org`
   - **Redirect URLs** (add both):
     - `https://isapm2026.org/auth/callback`
     - `https://www.isapm2026.org/auth/callback`
     - `http://localhost:3000/auth/callback` (for local development)

## Step 2: Update Email Template

1. Go to **Authentication → Email Templates**
2. Select **Confirm signup**
3. Replace the **Subject** with: `Confirm Your Signup - ISAPM 2026`
4. Replace the **Body (HTML)** with the content from `supabase-email-templates/confirm-signup-email.html`
5. Click **Save**

### Why Use {{ .ConfirmationURL }}?

Supabase's `{{ .ConfirmationURL }}` variable automatically generates a secure confirmation link that:
- Includes a one-time token
- Redirects to your configured redirect URL (`/auth/callback`)
- Handles token exchange automatically
- Works for both email confirmation and OAuth flows

## Step 3: Verify Environment Variables

Ensure these environment variables are set in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - For local development (e.g., `http://localhost:3000/auth/callback`)

## How It Works

### Sign-Up Flow:

1. **User submits registration** (`/auth/sign-up`)
   - Form sends email + password to `supabase.auth.signUp()`
   - `emailRedirectTo` option points to `/auth/callback`

2. **Supabase sends confirmation email**
   - User receives email with confirmation link
   - Link format: `https://[project].supabase.co/auth/v1/verify?token=[token]&redirect_to=https://isapm2026.org/auth/callback`

3. **User clicks confirmation link**
   - Supabase verifies the token
   - Redirects to `/auth/callback` with authentication code

4. **Callback page processes authentication** (`/auth/callback/page.tsx`)
   - Calls `supabase.auth.exchangeCodeForSession()` to establish session
   - Creates user profile if needed (or relies on database trigger)
   - Redirects to `/dashboard`

### Database Trigger:

The `handle_new_user()` trigger automatically creates a profile when a user confirms their email:
- Runs AFTER INSERT on `auth.users`
- Extracts user metadata
- Inserts into `public.profiles` table
- Uses `ON CONFLICT DO UPDATE` to handle duplicates

## Troubleshooting

### "Error confirming user"

**Cause**: Token is expired or invalid

**Solution**: 
- Check that redirect URLs are configured correctly in Supabase
- Ensure the confirmation link hasn't expired (24 hours)
- Ask user to request a new confirmation email

### "no_session" error

**Cause**: Session wasn't established after confirmation

**Solution**:
- Verify `exchangeCodeForSession()` is being called in `/auth/callback`
- Check browser console for errors
- Ensure cookies are enabled

### Profile not created

**Cause**: Database trigger failed

**Solution**:
- Check Supabase logs for trigger errors
- Verify RLS policies allow the trigger to insert
- Run the trigger fix script: `scripts/012-fix-handle-new-user-trigger.sql`

### Email not received

**Cause**: Email delivery issues

**Solution**:
- Check spam/junk folder
- Verify email provider isn't blocking Supabase emails
- Check Supabase logs for email sending errors
- Consider using a custom SMTP provider in Supabase settings

## Testing

### Test Email Confirmation:

1. Sign up with a real email address
2. Check your inbox for the confirmation email
3. Click the confirmation link
4. Verify you're redirected to the dashboard
5. Check that a profile was created in `public.profiles` table

### Local Development:

Set `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback` in your `.env.local` file for local testing.

## Security Best Practices

1. **Enable Row Level Security (RLS)** on all public tables
2. **Use HTTPS only** in production redirect URLs
3. **Set appropriate token expiration** (default 24 hours is good)
4. **Validate email domains** if needed for specific use cases
5. **Monitor failed confirmation attempts** in Supabase logs

## Support

If you encounter issues:
- Check Supabase logs in the Dashboard
- Review browser console for client-side errors
- Contact support at admin@isapm2026.org
