# Supabase Email Confirmation Setup Guide

This guide explains how to configure email confirmation for user registration using Supabase Authentication.

## Overview

The email confirmation flow works as follows:

1. User signs up with email/password on `/auth/sign-up`
2. Supabase sends a confirmation email using the custom template
3. User clicks "Confirm Email Address" button in the email
4. Link goes to `/api/auth/callback?token_hash=...&type=signup`
5. API route verifies the token with Supabase
6. User is redirected to `/auth/email-confirmed` success page
7. User can then log in at `/auth/login`

## Setup Instructions

### Step 1: Configure Supabase Authentication Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > URL Configuration**
3. Set the following values:

   **Site URL:**
   ```
   https://isapm2026.org
   ```

   **Redirect URLs:** (add all of these)
   ```
   https://isapm2026.org/api/auth/callback
   https://www.isapm2026.org/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```

4. Click **Save**

### Step 2: Configure Email Template

1. In Supabase dashboard, go to **Authentication > Email Templates**
2. Select **Confirm signup** from the template list
3. Replace the entire template content with the HTML from `supabase-email-templates/confirm-signup.html`
4. Click **Save**

### Step 3: Verify Environment Variables

Ensure these environment variables are set in your Vercel project:

```bash
# Supabase credentials (already configured via integration)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=https://isapm2026.org

# Optional: Development redirect URL (for local testing)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/api/auth/callback
```

### Step 4: Test the Flow

1. Go to `/auth/sign-up` and create a new account
2. Check your email inbox for the confirmation email
3. Click "Confirm Email Address" button
4. Verify you're redirected to `/auth/email-confirmed`
5. Click "Continue to Login" and sign in

## Email Template Variables

The Supabase email template uses these dynamic variables:

- `{{ .Email }}` - User's email address
- `{{ .TokenHash }}` - Email verification token (hashed)
- `{{ .SiteURL }}` - Your site URL from Supabase settings
- `{{ .Token }}` - Raw token (not recommended, use TokenHash)
- `{{ .ConfirmationURL }}` - Supabase's default confirmation URL (we override this)

## Troubleshooting

### "Email verification failed" error

**Problem:** User clicks confirmation link but gets an error.

**Solutions:**
- Check that `token_hash` parameter exists in the URL
- Verify the token hasn't expired (24 hour limit)
- Ensure Supabase URL configuration matches your domain exactly
- Check that `/api/auth/callback` route is deployed

### Confirmation email not received

**Problem:** User doesn't receive the confirmation email.

**Solutions:**
- Check Supabase dashboard **Logs** for email sending errors
- Verify email provider settings in Supabase
- Check spam/junk folder
- Ensure user's email is valid
- Check Supabase email rate limits

### 404 error on confirmation link

**Problem:** Clicking confirmation link shows "Page not found".

**Solutions:**
- Verify the email template uses `/api/auth/callback` (not `/auth/callback`)
- Check that the API route is deployed: `app/api/auth/callback/route.ts`
- Ensure redirect URLs are configured in Supabase settings

### User profile not created

**Problem:** Email is confirmed but user has no profile.

**Solutions:**
- Check that `profiles` table has correct RLS policies
- Verify the API callback route has profile creation code
- Check Supabase logs for database errors
- Ensure `handle_new_user` database trigger is working

## Email Design Features

The confirmation email template includes:

- Responsive design that works on all devices
- ISAPM branding with logo and colors
- Clear call-to-action button
- Fallback text link for compatibility
- Security information about link expiration
- Contact information for support
- Professional gradient header
- What's next section to guide users

## Security Best Practices

1. **Token Expiration:** Confirmation links expire after 24 hours
2. **Token Hashing:** We use `token_hash` instead of plain `token`
3. **HTTPS Only:** All redirect URLs must use HTTPS in production
4. **Single Use:** Tokens can only be used once
5. **Email Verification Required:** Users must confirm email before login

## Related Files

- `/app/api/auth/callback/route.ts` - Handles email verification
- `/app/auth/email-confirmed/page.tsx` - Success page after confirmation
- `/app/auth/sign-up/page.tsx` - User registration form
- `/supabase-email-templates/confirm-signup.html` - Email template
- `/lib/supabase/client.ts` - Supabase client configuration

## Support

For issues or questions:
- Email: admin@isapm2026.org
- WhatsApp: +62 896-0262-6709
- Documentation: Check this guide and Supabase docs
