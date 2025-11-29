# 📧 Email Backend Setup Guide

This guide will help you set up the production-ready email backend service for MovSense.

## 🎯 Overview

The email backend uses:
- **Vercel Serverless Functions** - Secure API endpoint
- **Resend API** - Professional email delivery service
- **User-specific settings** - Each user can customize their email sender info

## 📋 Prerequisites

1. **Vercel Account** (for serverless functions)
2. **Resend Account** (for email delivery)
3. **Supabase Project** (already set up)

## 🔧 Step-by-Step Setup

### 1. Sign Up for Resend

1. Go to [https://resend.com/](https://resend.com/)
2. Sign up for an account
3. Verify your email
4. Navigate to **API Keys** in the dashboard
5. Create a new API key
6. Copy the API key (starts with `re_`)

### 2. Configure Vercel Environment Variables

In your Vercel project dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add the following variables:

```
RESEND_API_KEY=re_your_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** 
- Use `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) for the backend API
- You can find your service role key in Supabase Dashboard → Settings → API

### 3. Run Database Migration

Run the migration to create the `user_email_settings` table:

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase/migrations/20250107000001_create_user_email_settings.sql`
5. Click **Run**

**Option B: Using Supabase CLI**

```bash
supabase migration up
```

### 4. Deploy to Vercel

If you haven't already:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel --prod
```

Or push to your connected Git repository and Vercel will auto-deploy.

## 🧪 Testing

1. **Sign in** to your MovSense account
2. Go to **Settings** (from the dashboard header)
3. Configure your **Email Settings**:
   - From Email: `Your Company <noreply@yourcompany.com>`
   - From Name: `Your Company Name`
   - Reply-To: `support@yourcompany.com`
4. Save the settings
5. Create a test quote and try sending it

## 📝 Email Domain Setup (Optional but Recommended)

For production, you'll want to use your own domain:

1. **In Resend Dashboard:**
   - Go to **Domains**
   - Add your domain (e.g., `yourcompany.com`)
   - Follow the DNS setup instructions
   - Verify your domain

2. **Update Your Email Settings:**
   - Once verified, use your domain in the From Email field
   - Example: `MovSense <quotes@yourcompany.com>`

## 🔒 Security Notes

- ✅ API keys are stored server-side only
- ✅ User authentication is verified on every request
- ✅ Users can only send emails for their own quotes
- ✅ RLS policies protect user email settings

## 🚀 Production Checklist

- [ ] Resend API key added to Vercel environment variables
- [ ] Supabase service role key added to Vercel
- [ ] Database migration run (`user_email_settings` table created)
- [ ] Test email sent successfully
- [ ] Email domain verified in Resend (optional but recommended)
- [ ] Email settings configured in Settings page

## 🐛 Troubleshooting

### "Failed to send email" error

1. Check Vercel function logs for errors
2. Verify `RESEND_API_KEY` is set in Vercel
3. Check Resend dashboard for API usage/quota
4. Verify email format is correct

### "Authorization header required" error

- User needs to be logged in
- Check that authentication token is being sent

### "Quote not found or access denied" error

- User can only send emails for quotes they own
- Verify the quote belongs to the logged-in user

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

