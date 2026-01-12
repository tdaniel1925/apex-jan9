/**
 * Stripe Configuration
 * Handles payment processing for e-commerce digital products
 */

import Stripe from 'stripe';
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js';

// Server-side Stripe instance (lazy-loaded to prevent build-time initialization)
let _stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!_stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured - Checkout feature unavailable');
    }

    _stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripeInstance;
}

// Backwards compatibility export using Proxy
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripeInstance()[prop as keyof Stripe];
  }
});

// Client-side Stripe instance (singleton)
let stripePromise: Promise<StripeJS | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Verify Stripe webhook signature
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Helper to format amount for Stripe (convert dollars to cents)
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Helper to format amount from Stripe (convert cents to dollars)
export function fromCents(amount: number): number {
  return amount / 100;
}
