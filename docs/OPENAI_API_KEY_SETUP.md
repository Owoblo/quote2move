# OpenAI API Key Configuration

## Issue
You're seeing this error:
```
❌ Backend API error: 500 Server configuration error: OpenAI API key not configured
```

## Solution
The OpenAI API key needs to be configured in Vercel's environment variables (not just in your local `.env` file).

## Steps to Fix

1. **Get your OpenAI API Key**
   - Go to https://platform.openai.com/account/api-keys
   - Create a new API key if you don't have one
   - Make sure it starts with `sk-` (not `sk-proj-`)
   - Copy the key (you won't be able to see it again)

2. **Add it to Vercel**
   - Go to your Vercel project dashboard: https://vercel.com/[your-username]/[your-project]
   - Click on **Settings** → **Environment Variables**
   - Add a new variable:
     - **Key**: `OPENAI_API_KEY`
     - **Value**: Your OpenAI API key (the one starting with `sk-`)
     - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

3. **Redeploy**
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Click **Redeploy**
   - Or trigger a new deployment by pushing a commit

## Verify It's Working

After redeploying, test the demo page:
1. Go to `https://movsense.com/demo`
2. Search for a property address in an active region
3. Select a property and click to analyze
4. The furniture detection should work without the 500 error

## Security Note

✅ **Good**: The API key is now in Vercel's environment variables (server-side only)  
❌ **Bad**: Never put the API key in client-side code or `.env` files that get committed to Git

The current setup is secure - the key only exists on the server in Vercel's environment variables and is never exposed to the browser.
