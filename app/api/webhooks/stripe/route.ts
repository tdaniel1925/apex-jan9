/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe - Handle Stripe events
 *
 * Handles:
 * - checkout.session.completed (product purchases)
 * - customer.subscription.created (new copilot subscriptions)
 * - customer.subscription.updated (subscription changes)
 * - customer.subscription.deleted (cancellations)
 * - invoice.paid (subscription payments - for commissions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/db/supabase-server';
import { stripe, verifyStripeWebhook } from '@/lib/stripe';
import { calculateRetailCommission } from '@/lib/engines/retail-commission-engine';
import {
  handleSubscriptionUpdate,
  handleSubscriptionCancelled,
} from '@/lib/copilot/subscription-service';
import { createCopilotCommission } from '@/lib/copilot/commission-service';
import { getTierFromPriceId, COPILOT_TIERS } from '@/lib/copilot/config';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyStripeWebhook(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Check if this is a subscription checkout or product checkout
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckout(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  try {
    // Extract metadata
    const metadata = session.metadata;
    if (!metadata || !metadata.agent_id) {
      throw new Error('Missing required metadata');
    }

    const agentId = metadata.agent_id;
    const userId = metadata.user_id;
    const totalBonusVolume = parseFloat(metadata.total_bonus_volume || '0');
    const productCount = parseInt(metadata.product_count || '0', 10);

    // Fetch agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single() as { data: any; error: any };

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Retrieve payment intent to get amount
    let amountPaid = 0;
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string
      );
      amountPaid = paymentIntent.amount / 100; // Convert from cents to dollars
    } else if (session.amount_total) {
      amountPaid = session.amount_total / 100;
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        agent_id: agentId,
        user_id: userId,
        total_amount: amountPaid,
        total_bonus_volume: totalBonusVolume,
        status: 'completed',
        payment_method: 'stripe',
        payment_status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string | null,
      } as never)
      .select()
      .single() as { data: any; error: any };

    if (orderError || !order) {
      throw new Error('Failed to create order');
    }

    // Parse product items from metadata and create order_items
    const orderItems = [];
    for (let i = 0; i < productCount; i++) {
      const productId = metadata[`product_${i}_id`];
      const quantity = parseInt(metadata[`product_${i}_quantity`] || '1', 10);
      const bonusVolume = parseFloat(metadata[`product_${i}_bv`] || '0');

      if (!productId) continue;

      // Fetch product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single() as { data: any; error: any };

      if (productError || !product) {
        console.error(`Product not found: ${productId}`);
        continue;
      }

      // Create order item
      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        quantity,
        unit_price: product.price,
        total_price: product.price * quantity,
        bonus_volume: bonusVolume,
      } as never);

      if (itemError) {
        console.error('Failed to create order item:', itemError);
      }

      orderItems.push({
        product,
        quantity,
        bonusVolume,
      });

      // Increment product sales counter
      await supabase.rpc('increment_product_sales', {
        p_product_id: product.id,
        p_quantity: quantity,
        p_revenue: product.price * quantity,
      } as any);
    }

    // Calculate and create commission
    const commission = calculateRetailCommission({
      order,
      agent,
    });

    const { error: commissionError } = await supabase.from('commissions').insert(commission as never);

    if (commissionError) {
      console.error('Failed to create commission:', commissionError);
      throw new Error('Failed to create commission');
    }

    // Database trigger will automatically:
    // 1. Update agent's personal_bonus_volume (PBV)
    // 2. Update agent's pbv_90_days
    //
    // Future: Trigger background job to:
    // 1. Calculate OBV (organization bonus volume) for upline
    // 2. Calculate override commissions for upline
    // 3. Check for Fast Start bonuses
    // 4. Check for rank advancement
    // 5. Credit wallet

    console.log(`✅ Order ${order.id} processed successfully for agent ${agent.id}`);
    console.log(`   - Total: $${amountPaid.toFixed(2)}`);
    console.log(`   - BV: ${totalBonusVolume}`);
    console.log(`   - Commission: $${commission.commission_amount.toFixed(2)}`);
  } catch (error) {
    console.error('Error processing checkout.session.completed:', error);
    throw error;
  }
}

/**
 * Handle subscription checkout completed
 */
async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata;
    if (!metadata?.agent_id) {
      console.log('Subscription checkout without agent_id, skipping');
      return;
    }

    console.log(`✅ Subscription checkout completed for agent ${metadata.agent_id}`);
    // The subscription.created webhook will handle the actual subscription setup
  } catch (error) {
    console.error('Error processing subscription checkout:', error);
    throw error;
  }
}

/**
 * Handle subscription created/updated events
 */
async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  try {
    const metadata = subscription.metadata;
    if (!metadata?.agent_id) {
      console.log('Subscription event without agent_id, skipping');
      return;
    }

    // Get the price ID from the first item
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) {
      throw new Error('No price ID in subscription');
    }

    // Get period dates (use type assertion for Stripe API compatibility)
    const sub = subscription as unknown as {
      id: string;
      customer: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
    };

    await handleSubscriptionUpdate(
      subscription.id,
      subscription.customer as string,
      subscription.status,
      priceId,
      new Date(sub.current_period_start * 1000),
      new Date(sub.current_period_end * 1000),
      metadata as Record<string, string>
    );

    console.log(`✅ Subscription ${subscription.status} for agent ${metadata.agent_id}`);
  } catch (error) {
    console.error('Error processing subscription event:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await handleSubscriptionCancelled(subscription.id);
    console.log(`✅ Subscription ${subscription.id} cancelled`);
  } catch (error) {
    console.error('Error processing subscription deletion:', error);
    throw error;
  }
}

/**
 * Handle invoice paid - create commission for subscription payments
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    // Type assertion for Stripe API compatibility
    const inv = invoice as unknown as {
      subscription: string | null;
      amount_paid: number;
      billing_reason: string | null;
    };

    // Only process subscription invoices
    if (!inv.subscription) {
      return;
    }

    // Get the subscription to find the agent
    const subscription = await stripe.subscriptions.retrieve(inv.subscription);
    const metadata = subscription.metadata;

    if (!metadata?.agent_id) {
      console.log('Invoice paid for subscription without agent_id, skipping commission');
      return;
    }

    // Skip if this is the first invoice (trial conversion handled separately)
    // Only create commission for renewal payments
    if (inv.billing_reason === 'subscription_create') {
      // First payment - create commission
      await createCopilotCommission(
        metadata.agent_id,
        subscription.id,
        inv.amount_paid,
        parseInt(metadata.bonus_volume || '0', 10),
        metadata.tier as 'basic' | 'pro' | 'agency' || 'basic'
      );
      console.log(`✅ Initial commission created for agent ${metadata.agent_id}`);
    } else if (inv.billing_reason === 'subscription_cycle') {
      // Renewal payment - create commission
      await createCopilotCommission(
        metadata.agent_id,
        subscription.id,
        inv.amount_paid,
        parseInt(metadata.bonus_volume || '0', 10),
        metadata.tier as 'basic' | 'pro' | 'agency' || 'basic'
      );
      console.log(`✅ Renewal commission created for agent ${metadata.agent_id}`);
    }
  } catch (error) {
    console.error('Error processing invoice paid:', error);
    throw error;
  }
}
