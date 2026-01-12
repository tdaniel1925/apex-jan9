/**
 * Stripe Checkout API
 * POST /api/checkout - Create Stripe checkout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent record
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Fetch product details from database
    const productIds = items.map((item: { product_id: string }) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Validate all products exist
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products are no longer available' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let totalBonusVolume = 0;
    const orderMetadata: Record<string, string> = {};

    items.forEach((item: { product_id: string; quantity: number }, index: number) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) return;

      // Add line item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.image_url ? [product.image_url] : undefined,
            metadata: {
              product_id: product.id,
              bonus_volume: product.bonus_volume.toString(),
            },
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });

      // Accumulate bonus volume
      totalBonusVolume += product.bonus_volume * item.quantity;

      // Store product info in metadata
      orderMetadata[`product_${index}_id`] = product.id;
      orderMetadata[`product_${index}_quantity`] = item.quantity.toString();
      orderMetadata[`product_${index}_bv`] = (product.bonus_volume * item.quantity).toString();
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/shop/cart`,
      customer_email: user.email,
      metadata: {
        agent_id: agent.id,
        user_id: user.id,
        total_bonus_volume: totalBonusVolume.toString(),
        product_count: items.length.toString(),
        ...orderMetadata,
      },
      payment_intent_data: {
        metadata: {
          agent_id: agent.id,
          user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
