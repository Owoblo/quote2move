import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment');
    return res.status(500).json({ error: 'Server configuration error: Stripe key not configured' });
  }

  const stripe = new Stripe(apiKey, {
    // Use the account's default API version or a specific stable version
    apiVersion: '2023-10-16', 
  });

  try {
    const { priceId, mode, successUrl, cancelUrl } = req.body;

    if (!priceId || !mode || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as 'payment' | 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'city_activation',
        setup_fee: 'true',
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create checkout session' 
    });
  }
}
