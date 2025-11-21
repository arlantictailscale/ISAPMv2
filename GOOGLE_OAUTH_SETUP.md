# Google OAuth Configuration Guide

If your Google Sign-In screen says "to continue to [project-id].supabase.co" instead of your website name (e.g., "isapm2026.org"), this is a configuration issue in the Google Cloud Console and Supabase.

Follow these steps to fix it:

## Option 1: Configure Google Cloud Console (Free)

This will change the app name, but the URL might still show `supabase.co` in some places unless you use a custom domain.

1.  **Go to Google Cloud Console**
    *   Navigate to [APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).
    *   Select your project.

2.  **Edit App Information**
    *   Click **Edit App**.
    *   **App name**: Change this to "ISAPM 2026" (or your desired name).
    *   **User support email**: Select your email.
    *   **App logo**: Upload your logo (optional).
    *   **Application home page**: Enter `https://www.isapm2026.org`.
    *   **Authorized domains**: Add `isapm2026.org` (and `supabase.co` if required).

3.  **Verify Domain**
    *   You may need to verify ownership of `isapm2026.org` in [Google Search Console](https://search.google.com/search-console) using the same Google account.

4.  **Publish App**
    *   If your Publishing Status is "Testing", the app name might not show up correctly for all users.
    *   Click **Publish App** to push it to Production.

## Option 2: Supabase Custom Domain (Recommended for Professional Branding)

To completely remove `supabase.co` from the login flow and show "to continue to isapm2026.org", you need to set up a Custom Domain in Supabase.

*Note: This typically requires a paid Supabase plan (Pro) + Custom Domain add-on.*

1.  **Configure Supabase**
    *   Go to your Supabase Dashboard > Settings > Custom Domains.
    *   Follow the instructions to set up a subdomain like `auth.isapm2026.org`.

2.  **Update Google Cloud Console**
    *   Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
    *   Edit your **OAuth 2.0 Client ID**.
    *   Update the **Authorized redirect URIs** to use your custom domain:
        *   Change `https://[project-id].supabase.co/auth/v1/callback`
        *   To `https://auth.isapm2026.org/auth/v1/callback`

3.  **Update Environment Variables**
    *   In your Vercel project settings, update `NEXT_PUBLIC_SUPABASE_URL` to your new custom domain (`https://auth.isapm2026.org`).

## Summary

*   **Quick Fix**: Update "App name" in Google Cloud Console > OAuth consent screen.
*   **Professional Fix**: Set up a Supabase Custom Domain (`auth.isapm2026.org`) to completely replace the Supabase URL.
