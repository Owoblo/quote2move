import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validation
    if (!customerName || !propertyAddress) {
      return res.status(400).json({
        error: 'Customer name and property address are required'
      });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

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
      console.error('Error creating upload session:', createError);
      return res.status(500).json({ error: 'Failed to create upload link' });
    }

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

  } catch (error) {
    console.error('Generate upload link error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
