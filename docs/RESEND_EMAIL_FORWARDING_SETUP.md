# Resend Email Forwarding Setup Guide

## Overview

MovSense uses `movsense.com` as the verified domain for all users. Each user gets:
- **Sending Address**: `quotes-{userId-prefix}@movsense.com` (for sending quotes)
- **Reply Address**: `replies-{userId-prefix}@movsense.com` (for receiving customer replies)

When customers reply to quotes, emails are automatically forwarded to the user's company email.

## Setup Steps

### 1. Verify Domain in Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify `movsense.com` domain
3. Add required DNS records (SPF, DKIM, DMARC)

### 2. Configure Email Routing (Resend Domain Settings)

In Resend Dashboard → Domains → movsense.com:

1. **Enable Inbound Email Routing**
   - Go to Domain Settings
   - Enable "Inbound Email" or "Email Routing"
   - Set webhook URL: `https://movsense.com/api/receive-email-webhook`

2. **Configure Catch-All or Specific Routes**
   - Option A (Recommended): Set up catch-all routing for `replies-*@movsense.com`
   - Option B: Set up individual routes for each user pattern

### 3. Set Up Webhook in Resend

1. Go to Resend Dashboard → Webhooks
2. Create a new webhook:
   - **URL**: `https://movsense.com/api/receive-email-webhook`
   - **Events**: Select "Email Received" or "Inbound Email"
   - **Secret**: (Optional, but recommended for production)

### 4. Environment Variables

Make sure these are set in Vercel:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
VERIFIED_EMAIL_DOMAIN=movsense.com
```

### 5. Database Migration

Run the migration to add the forwarding email field:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS forwarding_email TEXT;
```

Or use the migration file:
- `supabase/migrations/20250107000004_add_email_forwarding_to_settings.sql`

## How It Works

1. **Sending Quotes**:
   - User sends quote via `quotes-{userId}@movsense.com`
   - Customer receives email with reply-to: `replies-{userId}@movsense.com`

2. **Receiving Replies**:
   - Customer replies to `replies-{userId}@movsense.com`
   - Resend routes the email to `/api/receive-email-webhook`
   - Webhook extracts user ID from email address
   - Looks up user's forwarding email (priority: `forwarding_email` > `company_email` > user email)
   - Forwards the email to the user's company email

3. **User Configuration**:
   - Users can set their forwarding email in Settings → Company Information
   - If not set, replies forward to their Company Email
   - If Company Email is not set, replies forward to their account email

## Testing

1. Send a test quote to your email
2. Reply to the quote email
3. Check that the reply is forwarded to your configured email

## Troubleshooting

### Emails not forwarding

1. Check Resend webhook logs in Resend Dashboard
2. Check Vercel function logs for `/api/receive-email-webhook`
3. Verify domain is verified in Resend
4. Verify email routing is enabled in Resend
5. Check that user has `forwarding_email` or `company_email` set

### Webhook not receiving emails

1. Verify webhook URL is correct in Resend
2. Check Vercel function is deployed
3. Verify webhook signature (if configured)
4. Check Resend webhook delivery logs

## Security Notes

- Webhook signature verification is recommended for production
- Consider rate limiting on the webhook endpoint
- Store forwarding emails securely (they're already in Supabase with RLS)

