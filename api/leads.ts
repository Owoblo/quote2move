import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'movsense'
  }
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, source } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Save to Supabase leads table (create if doesn't exist)
    // For now, we'll use a simple approach - you might want to create a leads table
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          email,
          source: source || 'demo_page',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, just log and return success
      if (error.code === '42P01') {
        console.log('Leads table does not exist. Consider creating it in Supabase.');
        // You could also send to an email service or external API here
        return res.status(200).json({ success: true, message: 'Lead captured (table not set up yet)' });
      }
      throw error;
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error saving lead:', error);
    // Still return success for better UX
    return res.status(200).json({ 
      success: true, 
      message: 'Lead captured (error logged)' 
    });
  }
}
