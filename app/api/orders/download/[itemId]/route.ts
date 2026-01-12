/**
 * Download API
 * GET /api/orders/download/[itemId] - Generate download link for order item
 *
 * Security:
 * - Verify user owns this order item
 * - Check download limit
 * - Decrement downloads_remaining
 * - Return signed download URL (future: add expiration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
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
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Fetch order item with product and verify ownership
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .select(
        `
        *,
        order:orders!inner (
          id,
          agent_id,
          status
        ),
        product:products (
          id,
          name,
          digital_asset_url,
          download_limit
        )
      `
      )
      .eq('id', itemId)
      .single();

    if (itemError || !orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
    }

    // Verify ownership
    if (orderItem.order.agent_id !== agent.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if order is completed
    if (orderItem.order.status !== 'completed') {
      return NextResponse.json(
        { error: 'Order is not completed yet' },
        { status: 400 }
      );
    }

    // Check if product has a digital asset
    if (!orderItem.product.digital_asset_url) {
      return NextResponse.json(
        { error: 'This product does not have a digital download' },
        { status: 400 }
      );
    }

    // Check download limit (-1 = unlimited)
    if (
      orderItem.downloads_remaining !== -1 &&
      orderItem.downloads_remaining <= 0
    ) {
      return NextResponse.json(
        { error: 'Download limit reached' },
        { status: 403 }
      );
    }

    // Decrement downloads_remaining (unless unlimited)
    if (orderItem.downloads_remaining !== -1) {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          downloads_remaining: orderItem.downloads_remaining - 1,
        })
        .eq('id', itemId);

      if (updateError) {
        console.error('Failed to update downloads_remaining:', updateError);
      }
    }

    // Log download for analytics (future: add downloads tracking table)
    // For now, we'll just return the URL

    // TODO: Generate signed URL with expiration for better security
    // For now, return the direct URL
    const downloadUrl = orderItem.product.digital_asset_url;

    return NextResponse.json({
      downloadUrl,
      productName: orderItem.product.name,
      downloadsRemaining:
        orderItem.downloads_remaining === -1
          ? -1
          : orderItem.downloads_remaining - 1,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate download' },
      { status: 500 }
    );
  }
}
