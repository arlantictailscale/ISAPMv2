# Google Sheets Integration Setup Guide

This guide will help you set up the automated user profile export to Google Sheets.

## Overview

The system exports comprehensive user profile data to Google Sheets, including:
- Full Name + Titles/Degrees
- Satu Sehat Account Name and Email
- Registration Date
- National ID Number (NIK)
- Institution / Organization
- Profession
- Mobile Phone Number
- Account Email
- User Role

## Prerequisites

- A Google Cloud Platform account
- A Google Sheet for data export
- Admin access to the ISAPM 2026 application

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your **Project ID**

### 2. Enable Google Sheets API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click on it and press **Enable**

### 3. Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Enter a name (e.g., "isapm-sheets-export")
4. Grant the **Editor** role
5. Click **Done**
6. Note down the **Service Account Email** (looks like `name@project-id.iam.gserviceaccount.com`)

### 4. Generate Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Select **JSON** format
5. Click **Create**
6. A JSON file will be downloaded - keep it safe!

### 5. Extract Credentials from JSON

Open the downloaded JSON file and extract these values:

\`\`\`json
{
  "type": "service_account",
  "project_id": "your-project-id",           // → GOOGLE_CLOUD_PROJECT_ID
  "private_key_id": "key-id-here",           // → GOOGLE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  // → GOOGLE_PRIVATE_KEY
  "client_email": "name@project.iam.gserviceaccount.com"  // → GOOGLE_CLIENT_EMAIL
}
\`\`\`

### 6. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "ISAPM 2026 User Profiles" (or any name you prefer)
4. Copy the **Spreadsheet ID** from the URL:
   \`\`\`
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   \`\`\`
5. **Important:** Click **Share** and add this email with **Editor** permissions:
   \`\`\`
   isapm-profile-sheets-export@gen-lang-client-0519907284.iam.gserviceaccount.com
   \`\`\`

### 7. Add Environment Variables to Vercel

Add these environment variables to your Vercel project:

\`\`\`bash
# Your actual Google Cloud credentials
GOOGLE_CLOUD_PROJECT_ID="gen-lang-client-0519907284"
GOOGLE_PRIVATE_KEY_ID="22e4263a65c70c8165f947696ea984a500ad82f1"
GOOGLE_CLIENT_EMAIL="isapm-profile-sheets-export@gen-lang-client-0519907284.iam.gserviceaccount.com"

# Private key (copy exactly as shown, including the newlines)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDOqR/af/O4tLQo
bV0SZG3k+4O/vVbywpJlO/6ruID7kb40Cn9zHnBhNqmluxaxtFfEakn8WQjNL62P
xFEcids+rbDe+dMTKNGkFkqdWWLvFOTBaMbUf04Zg9g12KIzxEF8fsA20dnKRqmG
B1wsifSrKL9nv2xp5u2P3i7GMIF7IR+rl2Rf41bA4zogOaN2q0E3mcoAHnnP3Ti4
hV2AGH8FBw5w3QQMFTe9tDxbdc5TXi5OrrnsJspksZ3yPOJBMKmz5pXCgCjgZcg5
i4UN7w0Zzsr1kftEJKfHuUpmx5weAKfU40PzCkuApSph95Y0736oN6Ayr3Js5AfO
ckLfnH5bAgMBAAECggEAQNcyndlIjHryDb8mlRc6nb5Ge5n6FmfzC91TjehxW71C
KsziaSmzQ+UlPFEjkTUO1pssxIbg6pQbhkCn3GbqidNwa72BuwCzKiMuXQlHL9Fj
5sUroU+iHwJNi7OBTPG2REv2nhygk0UxelKD2pucTzmVOIWIi/+/KMUi8t8UOR++
lCDE8L1a+tJYBwg3b4q4bWf/VF8jG2TXzfctxxHJBjFeI9wPzeAd6jkVJ0ufDQzx
boZoeNcs2HAtY/gZnrWKJTXNkGUHo6Inxxc7DYbXqFOCk5mJMjwt8wAsF5wFzNxb
g31G2T4JWjLAJn/5h/sDNNt9my6BsP+YL4PLIGDZCQKBgQDq+bk6aIC7u2e8HZtg
zLo+kJSr6pjBrHW1D0l/h15LW4rRy8sG/fA9nmKBJJ9sHH3OUcwYnkTtB/uwLPcj
z0zOW81UnI/XVneQ+7zSCaKejAKammIkFaRQ51v3WbMXKNqFDKEqK6s49QdAJ1eI
cn6ZUX8tXOguhjwBCY+eDKkZ6QKBgQDhJtRu+2JVzE1sZsYxle0muwJYMGuv2j/q
Qz0aUbMMVugkTXIbAqd6nO0B4Y10UHYCiI/moMvjbhciE6m72GGm4jMA6r6pcFxx
DjL39GH68UhCUekMClLYZwOtmf+hMGiFICHAdQX2I1xMx2TirWmkOLBjQ68p9jCx
PlV3j3qnowKBgQCEO46KmR7BByDEk2DKY8v3w4N3D+lxLG19PCIfe32MKPMBR490
2tkkxAopJQP2Yj5GKnAR9pdRUOnJ5jQaWeGeS7lMgWLNSyK0W4aSKMv0L1STzoem
SOuUf+6YT0lioiH/N/FGexa7UeEHsFwpNE2cWGmajKs461+/MbM5vWQ4aQKBgQDh
Im6xOvUtTcjtaCcuVfh5De5eOKy1fssCeJGUy7T51bzy7+31TEYjuN7VTrCfagVW
qy8ZMhguJltDW94RU2Dx+qV9eT2FODF3avdUMS34O2RBzJ33yCrm8Lsg0ChpCXq6
A1M8mseHQ/x7WbZrY3OLHpRh7cAteVtfIDFeCD5heQKBgB95z/puCl8sHP7VW1lw
GfXc/YenugrIk1i5D3ZbfxivQchKOysSUc0FWmAVXek2It9LltUFM4SlahdYfSam
sajA+JBGIsjLfWa+vmHn449/um6UYQRjuEfhdSPkgG6jUcnRgpFaed9ymaTBU8ZX
CY6NVhySylZbpWRvrXc7xIfl
-----END PRIVATE KEY-----"

# Google Sheet Configuration (you need to set this)
GOOGLE_SHEETS_EXPORT_ID="your-spreadsheet-id-here"

# Cron Security (generate a random string)
CRON_SECRET="your-random-secret-here"
\`\`\`

**Important Notes:**
- For `GOOGLE_PRIVATE_KEY`, keep the `\n` characters as-is - they represent newlines
- Generate a strong random string for `CRON_SECRET` (e.g., using `openssl rand -base64 32`)
- All these should be added as **Environment Variables** in Vercel Project Settings

### 8. Deploy and Test

1. Deploy your application to Vercel
2. The cron job is configured to run daily at midnight (UTC)
3. You can also manually trigger exports from `/admin/export-users`

## Manual Export

Admins can manually export user profiles at any time:

1. Login with an admin account
2. Go to **User dropdown** > **Export User Profiles (Admin)**
3. Configure export options:
   - Enter custom Spreadsheet ID (optional)
   - Set sheet name
   - Enable/disable data anonymization
4. Click **Export to Google Sheets**

## Data Privacy

### Anonymization Feature

When anonymization is enabled, sensitive data is masked:
- **Names:** John Doe → J*** D**
- **Emails:** user@example.com → u*****r@example.com
- **NIK:** 1234567890123456 → 1234************
- **Phone:** +6281234567890 → +62*******890

### Best Practices

1. **Use anonymization** for testing or when sharing data with external parties
2. **Full export** should only be used when necessary and with proper authorization
3. **Limit access** to the Google Sheet - only share with authorized personnel
4. **Regular audits** of who has access to the exported data
5. **Compliance** with data protection regulations (GDPR, PDPA, etc.)

## Automated Synchronization

The system automatically syncs user profiles daily at midnight (UTC) via Vercel Cron Jobs.

### Cron Configuration

The cron job is configured in `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/sync-sheets",
      "schedule": "0 0 * * *"
    }
  ]
}
\`\`\`

### Cron Schedule Formats

You can customize the schedule using cron syntax:
- `0 0 * * *` - Daily at midnight UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight
- `0 12 * * *` - Daily at noon UTC

### Security

The cron endpoint is protected by the `CRON_SECRET` environment variable. Only requests with the correct authorization header can trigger the sync.

## Troubleshooting

### "Unauthorized" Error
- Verify you're logged in as an admin
- Check that your profile has `role = 'admin'` in the database

### "Google Sheets Spreadsheet ID not configured"
- Make sure `GOOGLE_SHEETS_EXPORT_ID` is set in environment variables
- Alternatively, provide a custom Spreadsheet ID in the export form

### "Failed to sync data"
- Verify all Google Cloud credentials are correct
- Check that the service account email has been granted Editor access to the sheet
- Ensure the Google Sheets API is enabled in your Google Cloud project

### "Could not find the relationship" (Supabase Error)
- This is expected - the system handles it gracefully
- The export uses direct database queries, not Supabase relationships

### Private Key Issues
- Make sure the private key includes the full content: `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`
- Keep `\n` characters in the environment variable
- Don't add extra quotes or escape characters

## Support

For issues or questions:
1. Check the application logs in Vercel dashboard
2. Review the console logs in the browser (F12)
3. Contact the development team with error messages

## Data Schema

The exported Google Sheet will have these columns:

| Column | Source | Description |
|--------|--------|-------------|
| Full Name | profiles.full_name | User's complete name |
| Title/Degree | profiles.title_degree | Academic titles and degrees |
| Satu Sehat Name | profiles.satu_sehat_name | Name registered on Satu Sehat |
| Satu Sehat Email | profiles.satu_sehat_email | Email registered on Satu Sehat |
| Registration Date | profiles.created_at | Account creation date |
| NIK | profiles.nik | National ID Number |
| Institution | profiles.institution | Organization/institution name |
| Profession | profiles.position | Professional role/position |
| Mobile Phone | profiles.phone | Contact phone number |
| Account Email | auth.users.email | Login email address |
| Role | profiles.role | User role (admin/user) |
