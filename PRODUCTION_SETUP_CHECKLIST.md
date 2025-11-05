# 🚀 Production Setup Checklist

## ✅ What's Been Set Up

1. **Email Backend API** (`api/send-quote-email.ts`)
   - Secure serverless function for sending emails
   - User authentication and authorization
   - Per-user email customization

2. **Email Settings UI** (Settings page)
   - Users can configure their email sender info
   - From email, from name, reply-to address

3. **Database Migration** (`user_email_settings` table)
   - Stores each user's email preferences

4. **Frontend Integration**
   - Updated to use backend API instead of direct Resend calls
   - Proper error handling

## 🔧 What You Need to Configure

### 1. Resend Account Setup

- [ ] Sign up at [https://resend.com/](https://resend.com/)
- [ ] Get your API key from the dashboard
- [ ] Copy the API key (starts with `re_`)

### 2. Vercel Environment Variables

Add these to your Vercel project settings → Environment Variables:

```
RESEND_API_KEY=re_your_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find:**
- `RESEND_API_KEY`: Resend dashboard → API Keys
- `SUPABASE_URL`: Supabase dashboard → Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase dashboard → Settings → API → service_role key (secret)

### 3. Run Database Migration

**Option A: Supabase Dashboard (Easiest)**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy contents of `supabase/migrations/20250107000001_create_user_email_settings.sql`
5. Paste and click **Run**

**Option B: Supabase CLI**
```bash
supabase migration up
```

### 4. Deploy to Vercel

If not already deployed:
```bash
vercel --prod
```

Or push to your Git repo and Vercel will auto-deploy.

## 🧪 Testing After Setup

1. **Sign in** to your account
2. Go to **Settings** page
3. Configure your email settings:
   - From Email: `Your Company <noreply@yourcompany.com>`
   - From Name: `Your Company Name`
   - Reply-To: `support@yourcompany.com`
4. Save the settings
5. Create a test quote
6. Send it to a test email address
7. Verify the email arrives with your configured sender info

## 📧 Email Domain (Optional but Recommended)

For production, verify your domain in Resend:

1. In Resend dashboard → **Domains**
2. Add your domain (e.g., `movsense.com`)
3. Add the DNS records they provide
4. Wait for verification
5. Update your email settings to use your domain

## 🔒 Security Notes

- ✅ API keys are server-side only (never exposed to browser)
- ✅ Each user can only send emails for their own quotes
- ✅ Authentication required for all email operations
- ✅ RLS policies protect user data

## 🎯 How It Works

1. User creates and sends a quote
2. Frontend calls `/api/send-quote-email` with quote data
3. Backend verifies user authentication
4. Backend loads user's email settings (from address, etc.)
5. Backend sends email via Resend API
6. Email is tracked in database
7. Success response sent to frontend

## 📝 Next Steps

Once everything is configured:
1. Test with a real email address
2. Verify emails are being delivered
3. Check Resend dashboard for delivery stats
4. Configure your custom domain (optional)
5. Launch! 🚀

## 🐛 Need Help?

- Check `EMAIL_BACKEND_SETUP.md` for detailed setup instructions
- Check Vercel function logs for errors
- Verify all environment variables are set correctly
- Ensure database migration has been run

