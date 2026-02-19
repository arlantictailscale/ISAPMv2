# Email System Setup

The ISAPM 2026 website uses a simple, direct email system powered by Resend.

## Features

- **Welcome Emails**: Sent when users confirm their email
- **Registration Confirmation**: Sent when users complete registration
- **Payment Verification**: Sent when admin verifies/rejects payment
- **Contact Form**: Forwards contact form submissions to admin

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain (isapm2026.org)
3. Copy your API key

### 2. Add Environment Variable

Add to your Vercel environment variables:

\`\`\`
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
\`\`\`

### 3. Test the System

1. Go to `/admin/email-test`
2. Enter a test email and name
3. Click "Send Test Email"
4. Check the recipient's inbox

## Email Functions

All email functions are in `lib/email.ts`:

- `sendWelcomeEmail(email, name)` - Welcome email for new users
- `sendRegistrationConfirmation(email, name, details)` - Registration confirmation
- `sendPaymentVerificationEmail(email, name, status, reason?)` - Payment status
- `sendContactFormEmail(formData)` - Contact form submissions

## Customization

To customize email templates, edit the HTML in `lib/email.ts`. Each function contains its own HTML template with inline styles.

## Troubleshooting

**Emails not sending:**
- Check RESEND_API_KEY is configured
- Verify domain in Resend dashboard
- Check Resend API logs

**Emails going to spam:**
- Set up SPF, DKIM, and DMARC records for your domain
- Verify sender domain in Resend

**Template not rendering:**
- Check HTML syntax in email functions
- Test with a simple plain text email first

## Monitoring

Check email delivery status in:
1. Resend Dashboard → Logs
2. Application logs (server-side)
3. Admin test page (`/admin/email-test`)
