import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Webhook endpoint for receiving incoming emails from Resend
 * This handles email replies sent to replies-{userId}@movsense.com
 * and forwards them to the user's company email
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify webhook signature (Resend sends signature in headers)
  const signature = req.headers['resend-signature'] as string;
  
  if (!signature) {
    console.warn('Missing Resend signature header');
    // For development, we'll allow requests without signature
    // In production, you should verify the signature
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    // Resend webhook format for incoming emails
    // https://resend.com/docs/dashboard/webhooks
    const { type, data } = payload;

    if (type !== 'email.received') {
      return res.status(200).json({ received: true, message: 'Not an email received event' });
    }

    const { from, to, subject, text, html, headers } = data;

    // Extract user ID from the "to" email address
    // Format: replies-{userId-prefix}@movsense.com
    const toEmail = Array.isArray(to) ? to[0] : to;
    const toMatch = toEmail?.match(/replies-([a-f0-9]{8})@movsense\.com/);

    if (!toMatch) {
      console.warn('Invalid reply-to email format:', toEmail);
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    const userIdPrefix = toMatch[1];

    // Find user by matching the prefix (first 8 chars of UUID)
    // We'll need to query users and match by prefix
    const { data: users, error: userError } = await supabase
      .auth.admin.listUsers();

    if (userError || !users) {
      console.error('Error fetching users:', userError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Find user whose ID starts with the prefix
    const user = users.users.find(u => u.id.substring(0, 8) === userIdPrefix);

    if (!user) {
      console.warn('User not found for prefix:', userIdPrefix);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's company email settings
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('company_email, forwarding_email')
      .eq('user_id', user.id)
      .single();

    // Determine forwarding email
    // Priority: forwarding_email > company_email > user email
    const forwardToEmail = companySettings?.forwarding_email 
      || companySettings?.company_email 
      || user.email;

    if (!forwardToEmail) {
      console.warn('No forwarding email found for user:', user.id);
      return res.status(400).json({ error: 'No forwarding email configured' });
    }

    // Forward the email to the user's company email
    const forwardResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `MovSense <noreply@movsense.com>`,
        to: forwardToEmail,
        subject: `Re: ${subject}`,
        reply_to: from,
        text: `You received a reply from ${from}:\n\n${text || html?.replace(/<[^>]*>/g, '') || 'No content'}`,
        html: html ? `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <p>You received a reply from <strong>${from}</strong>:</p>
            <div style="border-left: 3px solid #00C2FF; padding-left: 15px; margin: 20px 0;">
              ${html}
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Reply to this email to respond directly to ${from}
            </p>
          </div>
        ` : undefined,
      }),
    });

    if (!forwardResponse.ok) {
      const errorData = await forwardResponse.text();
      console.error('Error forwarding email:', errorData);
      return res.status(500).json({ error: 'Failed to forward email' });
    }

    // Log the email event
    if (supabase) {
      await supabase
        .from('quote_email_events')
        .insert({
          quote_id: null, // We don't know which quote this is for
          event_type: 'email_received',
          event_data: {
            timestamp: new Date().toISOString(),
            from: from,
            to: toEmail,
            subject: subject,
            forwarded_to: forwardToEmail
          }
        });
    }

    return res.status(200).json({
      success: true,
      message: 'Email forwarded successfully',
      forwarded_to: forwardToEmail
    });

  } catch (error: any) {
    console.error('Error processing email webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

