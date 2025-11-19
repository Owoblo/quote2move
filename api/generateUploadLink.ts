import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// For Vercel serverless functions, use non-VITE prefixed env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[generateUploadLink] Starting...');
    console.log('[generateUploadLink] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseServiceKey,
      hasAppUrl: !!(process.env.VITE_APP_URL || process.env.SUPABASE_URL)
    });
    const {
      customerName,
      customerEmail,
      customerPhone,
      propertyAddress,
      bedrooms,
      bathrooms,
      sqft,
      expiresInDays = 7
    } = req.body;

    // Get authenticated user from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[generateUploadLink] No auth header');
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[generateUploadLink] Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[generateUploadLink] Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized', details: authError?.message });
    }

    console.log('[generateUploadLink] User authenticated:', user.id);

    // Validation
    if (!customerName || !propertyAddress) {
      return res.status(400).json({
        error: 'Customer name and property address are required'
      });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    console.log('[generateUploadLink] Creating upload session...');
    console.log('[generateUploadLink] Data:', {
      user_id: user.id,
      customerName,
      propertyAddress,
      bedrooms,
      bathrooms,
      sqft,
      expiresAt: expiresAt.toISOString()
    });

    // Create upload session with customer type
    const { data: uploadSession, error: createError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        upload_type: 'customer',
        status: 'pending',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        property_address: propertyAddress,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        sqft: sqft,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('[generateUploadLink] Database error:', createError);
      return res.status(500).json({
        error: 'Failed to create upload link',
        details: createError.message,
        hint: createError.hint,
        code: createError.code
      });
    }

    console.log('[generateUploadLink] Upload session created:', uploadSession.id);

    // Generate shareable URL
    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    const shareableUrl = `${baseUrl}/customer-upload/${uploadSession.token}`;

    return res.status(200).json({
      success: true,
      uploadSession: {
        id: uploadSession.id,
        token: uploadSession.token,
        customerName: uploadSession.customer_name,
        customerEmail: uploadSession.customer_email,
        propertyAddress: uploadSession.property_address,
        shareableUrl,
        expiresAt: uploadSession.expires_at,
        createdAt: uploadSession.created_at
      }
    });

  } catch (error: any) {
    console.error('[generateUploadLink] Unexpected error:', error);
    console.error('[generateUploadLink] Error stack:', error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
