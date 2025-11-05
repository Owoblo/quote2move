import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EmailRequest {
  quoteId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  moveDate: string;
  originAddress: string;
  destinationAddress: string;
  totalAmount: number;
  quoteUrl: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const {
      quoteId,
      customerEmail,
      customerName,
      customerPhone,
      moveDate,
      originAddress,
      destinationAddress,
      totalAmount,
      quoteUrl
    }: EmailRequest = req.body;

    // Validate required fields
    if (!quoteId || !customerEmail || !customerName || !quoteUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify quote belongs to the authenticated user
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, user_id, custom_logo_url, brand_colors')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single();

    if (quoteError || !quote) {
      return res.status(403).json({ error: 'Quote not found or access denied' });
    }

    // Get user's email settings (from address, etc.)
    const { data: userSettings } = await supabase
      .from('user_email_settings')
      .select('from_email, from_name, reply_to')
      .eq('user_id', user.id)
      .single();

    // Use user settings or defaults
    const fromEmail = userSettings?.from_email || 'MovSense <onboarding@resend.dev>';
    const fromName = userSettings?.from_name || 'MovSense';
    const replyTo = userSettings?.reply_to || 'support@movsense.com';

    if (!resendApiKey) {
      return res.status(500).json({ error: 'Resend API key not configured. Please add RESEND_API_KEY to your environment variables.' });
    }

    // Generate email HTML
    const emailHTML = generateEmailHTML({
      customerName,
      customerEmail,
      customerPhone,
      moveDate,
      originAddress,
      destinationAddress,
      totalAmount,
      quoteUrl,
      logoUrl: quote.custom_logo_url,
      brandColors: quote.brand_colors
    });

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [customerEmail],
        reply_to: replyTo,
        subject: `Your Moving Quote - ${customerName}`,
        html: emailHTML
      })
    });

    if (!emailResponse.ok) {
      let errorData: any;
      const contentType = emailResponse.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await emailResponse.json();
        } else {
          const errorText = await emailResponse.text();
          errorData = { message: errorText || `Resend API returned ${emailResponse.status}` };
        }
      } catch (parseError) {
        errorData = { message: `Resend API error: ${emailResponse.status} ${emailResponse.statusText}` };
      }
      
      console.error('Resend API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to send email', 
        details: errorData.message || 'Unknown error'
      });
    }

    const emailResult = await emailResponse.json();

    // Track email sent in database
    await supabase
      .from('quote_email_events')
      .insert({
        quote_id: quoteId,
        event_type: 'email_sent',
        event_data: {
          timestamp: new Date().toISOString(),
          email_id: emailResult.id,
          recipient: customerEmail
        }
      });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult.id
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

function generateEmailHTML(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  moveDate: string;
  originAddress: string;
  destinationAddress: string;
  totalAmount: number;
  quoteUrl: string;
  logoUrl?: string | null;
  brandColors?: any;
}): string {
  const primaryColor = data.brandColors?.primary || '#2563eb';
  const secondaryColor = data.brandColors?.secondary || '#1e40af';
  const accentColor = data.brandColors?.accent || '#10b981';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Moving Quote</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 5px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; background: #f8fafc; }
        .quote-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .cta-button { display: inline-block; background: ${accentColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        .details { margin: 15px 0; }
        .details strong { color: ${primaryColor}; }
        .logo { max-height: 60px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" class="logo" />` : ''}
          <h1>MOVSENSE</h1>
          <p>Professional Moving Services</p>
        </div>
        
        <div class="content">
          <h2 style="color: ${primaryColor}; margin-bottom: 20px;">Your Moving Quote is Ready!</h2>
          
          <p>Hi ${data.customerName},</p>
          
          <p>Thank you for choosing MovSense for your move. We've prepared a detailed quote based on your inventory and requirements.</p>
          
          <div class="quote-box">
            <h3 style="margin-top: 0; color: #374151;">Move Details</h3>
            <div class="details">
              <p><strong>From:</strong> ${data.originAddress}</p>
              <p><strong>To:</strong> ${data.destinationAddress}</p>
              <p><strong>Move Date:</strong> ${data.moveDate}</p>
              <p><strong>Total Estimate:</strong> $${data.totalAmount.toFixed(2)}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.quoteUrl}" class="cta-button">
              View Your Detailed Quote
            </a>
          </div>
          
          <p>This quote includes:</p>
          <ul>
            <li>Detailed inventory analysis</li>
            <li>Professional moving services</li>
            <li>Additional services (if selected)</li>
            <li>Interactive quote viewer with accept/decline options</li>
          </ul>
          
          <p>If you have any questions, you can ask them directly in the quote viewer.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>MovSense Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>This quote is valid for 30 days from the date of generation.</p>
          <p>For support, contact us at support@movsense.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

