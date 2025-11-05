import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = req.query.session_id as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return res.status(200).json({ 
        verified: true, 
        session,
        message: 'Payment verified successfully' 
      });
    }

    return res.status(200).json({ 
      verified: false, 
      payment_status: session.payment_status,
      message: 'Payment not completed' 
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to verify payment',
      verified: false 
    });
  }
}
