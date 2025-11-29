# Demo Page Setup Guide

## Overview
The demo page (`/demo`) is a complete landing page with:
- Address search with active region validation
- Interactive demo for active regions
- City activation payment ($249 one-time fee)
- Video embed section
- Lead capture form for waitlist

## Required Environment Variables

### Stripe Configuration
Add these to your `.env` file and Vercel environment variables:

```bash
# Stripe Publishable Key (frontend)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Secret Key (backend - Vercel only)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price ID for activation fee ($249)
REACT_APP_STRIPE_ACTIVATION_PRICE_ID=price_...
```

### Supabase Configuration
Already configured, but ensure these are set:
```bash
REACT_APP_SUPABASE_URL=https://...
REACT_APP_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For serverless functions
SUPABASE_URL=https://...  # For serverless functions
```

## Setup Steps

### 1. Create Stripe Product and Price
1. Go to Stripe Dashboard → Products
2. Create a new product: "City Activation Fee"
3. Set price: $249.00 (one-time payment)
4. Copy the Price ID (starts with `price_`)
5. Add to `.env`: `REACT_APP_STRIPE_ACTIVATION_PRICE_ID=price_...`

### 2. Set Up Leads Table
The migration file is created at:
```
supabase/migrations/20250105000001_create_leads_table.sql
```

Run it in your Supabase SQL Editor to create the leads table.

### 3. Update Video Embed
In `src/pages/DemoPage.tsx`, replace the placeholder video ID:
```tsx
src="https://www.loom.com/embed/your-video-id-here"
```
With your actual Loom or YouTube embed URL.

### 4. Active Regions
Currently active regions are defined in `src/pages/DemoPage.tsx`:
```tsx
const ACTIVE_REGIONS = [
  'Windsor',
  'Tecumseh',
  'LaSalle',
  'Kitchener',
  'Toronto',
  'GTA',
  'Amherstburg',
];
```

Update this array as you activate more cities.

## Features

### 1. Region Validation
- Users enter an address
- System checks if it's in an active region
- Active regions show full demo
- Inactive regions show activation CTA

### 2. Activation Payment Flow
- User clicks "Activate My Account"
- Creates Stripe checkout session
- Redirects to Stripe payment
- After payment, redirects to `/demo/thank-you`
- Payment is verified server-side

### 3. Lead Capture
- For users in inactive regions
- Email form captures leads
- Saves to Supabase `leads` table
- Can be used for future marketing

### 4. Video Demo
- Embedded Loom/YouTube video
- Shows product in action
- Helps convert skeptics

## API Endpoints

### `/api/create-checkout-session`
Creates a Stripe checkout session for activation payment.

**Request:**
```json
{
  "priceId": "price_...",
  "mode": "payment",
  "successUrl": "...",
  "cancelUrl": "..."
}
```

### `/api/verify-payment`
Verifies payment status from Stripe session ID.

**Request:**
```
GET /api/verify-payment?session_id=cs_...
```

### `/api/leads`
Saves email addresses for waitlist.

**Request:**
```json
{
  "email": "user@example.com",
  "source": "demo_page_waitlist"
}
```

## Testing

1. **Test Active Region:**
   - Go to `/demo`
   - Enter address: "125 Links Dr, Amherstburg, ON"
   - Should show green success message
   - Demo should load below

2. **Test Inactive Region:**
   - Enter address: "123 Main St, New York, NY"
   - Should show yellow warning
   - Activation CTA should appear

3. **Test Payment Flow:**
   - Click "Activate My Account"
   - Should redirect to Stripe checkout
   - Use test card: `4242 4242 4242 4242`
   - Should redirect to thank you page

4. **Test Lead Capture:**
   - Scroll to bottom
   - Enter email and submit
   - Should show success message
   - Check Supabase `leads` table

## Customization

### Update Pricing
Edit `src/pages/DemoPage.tsx`:
```tsx
<span className="text-5xl font-bold">$249</span>
```

### Update Included Features
Edit the list items in the activation CTA section.

### Add More Active Regions
Update the `ACTIVE_REGIONS` array.

## Troubleshooting

### Stripe Payment Not Working
- Check `STRIPE_SECRET_KEY` is set in Vercel
- Verify `REACT_APP_STRIPE_PUBLISHABLE_KEY` is set
- Check Price ID is correct

### Leads Not Saving
- Ensure leads table migration is run
- Check Supabase RLS policies
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Demo Not Loading
- Check Supabase connection
- Verify address is in active region
- Check browser console for errors
