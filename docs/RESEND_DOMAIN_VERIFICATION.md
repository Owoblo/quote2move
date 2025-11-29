# 📧 Resend Domain Verification Guide

## Current Setup

Your application is configured to use **`movsense.com`** as the email domain.

## ⚠️ Important: Domain Verification Required

Before emails can be sent, you **must verify your domain** in Resend.

## Steps to Verify movsense.com Domain

### 1. Go to Resend Dashboard

1. Log in to [Resend Dashboard](https://resend.com/)
2. Navigate to **Domains** in the left sidebar
3. Click **Add Domain**

### 2. Add Your Domain

1. Enter `movsense.com` (without www)
2. Click **Add Domain**

### 3. Add DNS Records

Resend will provide you with DNS records to add. You'll need to add these to your domain's DNS settings:

**Example DNS Records (Resend will provide exact values):**
- **TXT Record** for domain verification
- **SPF Record** (TXT)
- **DKIM Records** (CNAME)
- **DMARC Record** (TXT) - Optional but recommended

### 4. Add DNS Records in Your Domain Provider

1. Log in to your domain registrar (where you bought movsense.com)
2. Go to DNS Management
3. Add the records provided by Resend
4. Wait for DNS propagation (usually 5-30 minutes, can take up to 48 hours)

### 5. Verify Domain in Resend

1. Go back to Resend Dashboard → Domains
2. Click on `movsense.com`
3. Click **Verify Domain**
4. Wait for verification (usually takes a few minutes after DNS records propagate)

### 6. Test Email Sending

Once verified:
1. Go to your MovSense application
2. Try sending a test quote email
3. Check if it arrives successfully

## Email Addresses Used

- **From Email**: `quotes@movsense.com` (default)
- **Reply-To**: `support@movsense.com` (default)
- **From Name**: `MovSense`

These can be customized per user in the Settings page.

## Troubleshooting

### "Domain not verified" Error

If you see this error:
1. Check Resend Dashboard → Domains to see verification status
2. Verify all DNS records are added correctly
3. Wait for DNS propagation (can take up to 48 hours)
4. Try verifying again in Resend

### "DNS records not found"

- Double-check that DNS records are added exactly as provided by Resend
- Ensure you're adding them to the correct domain (movsense.com, not www.movsense.com)
- Wait for DNS propagation

### Temporary Solution: Use Resend's Default Domain

If you need to send emails immediately while waiting for domain verification:
1. Go to Settings in your MovSense app
2. Change the "From Email" to: `MovSense <onboarding@resend.dev>`
3. This uses Resend's default verified domain (limited to testing)

## After Verification

Once `movsense.com` is verified:
- ✅ All emails will be sent from `@movsense.com` addresses
- ✅ Better email deliverability
- ✅ Professional branding
- ✅ No more "domain not verified" errors

## Need Help?

- [Resend Domain Setup Guide](https://resend.com/docs/dashboard/domains/introduction)
- [Resend Support](https://resend.com/support)

