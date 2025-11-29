# 🔧 Vercel Environment Variables Setup

## Critical: Missing Environment Variables

The email sending API requires the following environment variables to be set in Vercel:

## Required Environment Variables

1. **`SUPABASE_URL`**
   - Your Supabase project URL
   - Format: `https://your-project-id.supabase.co`
   - Find it in: Supabase Dashboard → Settings → API → Project URL

2. **`SUPABASE_SERVICE_ROLE_KEY`**
   - Your Supabase service role key (secret, not the anon key!)
   - Format: `eyJhbGc...` (long JWT token)
   - Find it in: Supabase Dashboard → Settings → API → service_role key
   - ⚠️ **Important**: This is the SECRET key, not the anon key

3. **`RESEND_API_KEY`**
   - Your Resend API key
   - Format: `re_...` (starts with `re_`)
   - Find it in: Resend Dashboard → API Keys

4. **`VERIFIED_EMAIL_DOMAIN`** (Optional)
   - The domain you've verified in Resend for sending emails
   - Default: `movsense.com`
   - For testing: Use the domain verified with `johnowolabi80@gmail.com`
   - ⚠️ **IMPORTANT**: Set this to the DOMAIN only (e.g., `example.com`), NOT an email address!
   - ✅ Correct: `example.com` or `yourdomain.com`
   - ❌ Wrong: `johnowolabi80@gmail.com` or `user@example.com`

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - Click **Add New**
   - Enter the variable name (e.g., `SUPABASE_URL`)
   - Enter the value
   - Select **Production**, **Preview**, and **Development** (or as needed)
   - Click **Save**

4. **Redeploy** your application after adding variables:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

## Verification

After adding the variables and redeploying, check the Vercel function logs:
- Go to **Deployments** → Select a deployment → **Functions** tab
- Look for any errors in the logs

## Common Issues

### "supabaseUrl is required"
- **Cause**: `SUPABASE_URL` is not set or is empty
- **Fix**: Add the correct Supabase URL to Vercel environment variables

### "Resend API key not configured"
- **Cause**: `RESEND_API_KEY` is not set
- **Fix**: Add your Resend API key to Vercel environment variables

### "Invalid or expired token"
- **Cause**: Authentication issue (different from env vars)
- **Fix**: This is a user authentication issue, not a configuration problem

## Quick Setup Checklist

- [ ] `SUPABASE_URL` added to Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to Vercel (not the anon key!)
- [ ] `RESEND_API_KEY` added to Vercel
- [ ] Variables set for Production environment
- [ ] Application redeployed after adding variables
- [ ] Tested email sending functionality

## Testing

After setup, test by:
1. Logging into your application
2. Creating a quote
3. Clicking "Send Quote via Email"
4. Checking Vercel function logs for any errors

