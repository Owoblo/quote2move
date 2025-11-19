import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// For Vercel serverless functions, use non-VITE prefixed env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customerName,
      customerPhone,
      propertyAddress,
      shareableUrl,
      companyName
    } = req.body;

    // Validate required fields
    if (!customerPhone || !shareableUrl) {
      return res.status(400).json({
        error: 'Customer phone and shareable URL are required'
      });
    }

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

    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return res.status(500).json({
        error: 'Twilio is not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to environment variables.'
      });
    }

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format phone number (ensure it starts with +1 for US numbers)
    let formattedPhone = customerPhone.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone; // Add US country code
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Create SMS message
    const company = companyName || 'MovSense';
    const greeting = customerName ? `Hi ${customerName.split(' ')[0]},` : 'Hello,';
    const addressLine = propertyAddress ? `\n\nProperty: ${propertyAddress}` : '';

    const message = `${greeting}

${company} needs photos of your property to prepare an accurate moving quote.${addressLine}

Please upload photos using this secure link:
${shareableUrl}

This link will expire in 7 days. If you have any questions, please reply to this message.

- ${company} Team`;

    // Send SMS via Twilio
    const smsResult = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log('SMS sent successfully:', smsResult.sid);

    return res.status(200).json({
      success: true,
      messageSid: smsResult.sid,
      status: smsResult.status,
      to: formattedPhone
    });

  } catch (error: any) {
    console.error('Send SMS error:', error);

    // Handle Twilio-specific errors
    if (error.code) {
      return res.status(400).json({
        error: 'Failed to send SMS',
        details: error.message,
        code: error.code
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
