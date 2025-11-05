# 📧 User Email System Design

## Overview

The CRM automatically assigns each user a unique email address without requiring DNS setup. This allows users to send quotes and receive replies immediately after signing up.

## How It Works

### Automatic Email Assignment

When a user signs up, they automatically get:
- **From Email**: `quotes-{userId-prefix}@movsense.com`
- **Reply-To**: `replies-{userId-prefix}@movsense.com`
- **From Name**: `MovSense` (customizable)

**Example:**
- User ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- From Email: `quotes-a1b2c3d4@movsense.com`
- Reply-To: `replies-a1b2c3d4@movsense.com`

### Benefits

✅ **No DNS Setup Required** - Users don't need to configure DNS records  
✅ **Automatic Assignment** - Email addresses are generated on-the-fly  
✅ **Unique Per User** - Each user gets their own email address  
✅ **Replies Work** - All replies go to the user's assigned address  
✅ **Customizable** - Users can set custom emails in Settings (if they verify their domain)

## Domain Requirements

### For Production

1. **Verify `movsense.com` in Resend**
   - Go to Resend Dashboard → Domains
   - Add `movsense.com`
   - Add DNS records provided by Resend
   - Wait for verification

2. **Email Routing**
   - All `quotes-*@movsense.com` emails route through Resend
   - All `replies-*@movsense.com` emails route through Resend
   - Replies can be forwarded to a central inbox or handled via Resend webhooks

### For Testing

Use a verified domain (like the one registered with `johnowolabi80@gmail.com`):
- Update `verifiedDomain` in `api/send-quote-email.ts`
- Change to your verified domain
- All emails will use that domain instead

## User Customization

Users can customize their email settings in the Settings page:

1. **Custom From Email** (Optional)
   - If they have a verified domain, they can use it
   - Example: `My Company <quotes@mycompany.com>`
   - If domain is not verified, system falls back to auto-generated address

2. **Custom From Name**
   - Always customizable
   - Example: "John's Moving Company"

3. **Custom Reply-To**
   - Can be set to any email address
   - Defaults to their auto-generated reply address

## Implementation Details

### Backend Logic (`api/send-quote-email.ts`)

```typescript
// Generate user-specific email
const userIdPrefix = user.id.substring(0, 8);
const verifiedDomain = 'movsense.com';
const defaultFromEmail = `quotes-${userIdPrefix}@${verifiedDomain}`;
const defaultReplyTo = `replies-${userIdPrefix}@${verifiedDomain}`;

// Use user settings or auto-generated
let fromEmail = userSettings?.from_email || `MovSense <${defaultFromEmail}>`;
let replyTo = userSettings?.reply_to || defaultReplyTo;
```

### Database Schema

The `user_email_settings` table:
- `from_email`: NULL = use auto-generated, TEXT = use custom
- `from_name`: User's display name
- `reply_to`: NULL = use auto-generated, TEXT = use custom

## Email Handling

### Sending Emails

1. User creates and sends a quote
2. System checks if user has custom email settings
3. If custom domain fails verification, falls back to auto-generated
4. Email is sent via Resend API

### Receiving Replies

Option 1: **Central Inbox** (Recommended)
- All `replies-*@movsense.com` emails forward to a central inbox
- Set up email forwarding in your email provider
- Or use Resend webhooks to route to your system

Option 2: **Resend Webhooks**
- Set up webhook in Resend Dashboard
- Handle incoming emails via webhook
- Route to appropriate user in CRM

Option 3: **Individual Inboxes**
- Each user can set up forwarding for their reply address
- More complex but allows direct user access

## Migration Path

### Current Setup (Testing)
- Using verified domain from `johnowolabi80@gmail.com`
- All emails work immediately

### Future Setup (Production)
1. Verify `movsense.com` in Resend
2. Update `verifiedDomain` in code
3. Deploy - all users automatically get `@movsense.com` addresses
4. Set up reply handling (webhooks or forwarding)

## Security Considerations

- ✅ Each user can only send emails for their own quotes
- ✅ Email addresses are tied to user authentication
- ✅ Domain verification prevents spoofing
- ✅ RLS policies protect user email settings

## Troubleshooting

### "Domain not verified" Error

**If using custom domain:**
- Verify domain in Resend Dashboard
- Add DNS records
- Wait for verification

**If using auto-generated address:**
- Check that `movsense.com` (or your verified domain) is verified in Resend
- Verify DNS records are correct
- Check Resend Dashboard → Domains

### Emails Not Arriving

1. Check Resend Dashboard → Emails for delivery status
2. Verify recipient email address is correct
3. Check spam folder
4. Verify domain is properly configured in Resend

## Next Steps

1. ✅ Code updated to use auto-generated emails
2. ⏳ Verify `movsense.com` in Resend (or use verified domain for testing)
3. ⏳ Set up reply handling (webhooks or forwarding)
4. ⏳ Test email sending with multiple users
5. ⏳ Monitor email delivery rates

