/**
 * Admin Single Payout API
 * GET - Get payout details
 * PATCH - Update payout status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { sendPayoutNotification, sendWithdrawalRejected } from '@/lib/email/email-service';
import type { Payout, Wallet } from '@/lib/types/database';

// Update schema
const updatePayoutSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('payouts')
      .select('*, agents(id, first_name, last_name, email, agent_code, rank)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return notFoundResponse('Payout not found');
    }

    // Get related wallet transaction
    const { data: transaction } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('reference_id', id)
      .eq('reference_type', 'payout')
      .single();

    return NextResponse.json({
      payout: data,
      transaction: transaction || null,
    });
  } catch (error) {
    console.error('Admin payout GET error:', error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updatePayoutSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = parseResult.data;

    // Get current payout
    const { data: currentData, error: fetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      return notFoundResponse('Payout not found');
    }

    const currentPayout = currentData as Payout;

    // Can't modify completed payouts
    if (currentPayout.status === 'completed') {
      return badRequestResponse('Cannot modify a completed payout');
    }

    // Handle failed status - restore wallet balance
    if (updates.status === 'failed' && currentPayout.status !== 'failed') {
      // Restore the amount to wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('agent_id', currentPayout.agent_id)
        .single();

      if (walletData) {
        const wallet = walletData as Wallet;
        await supabase
          .from('wallets')
          .update({
            balance: wallet.balance + currentPayout.amount,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('agent_id', currentPayout.agent_id);

        // Create reversal transaction
        await supabase.from('wallet_transactions').insert({
          agent_id: currentPayout.agent_id,
          type: 'credit',
          category: 'adjustment',
          amount: currentPayout.amount,
          balance_after: wallet.balance + currentPayout.amount,
          description: `Payout failed - funds restored`,
          reference_type: 'payout',
          reference_id: id,
        } as never);
      }
    }

    // Update payout
    const updateData = {
      ...updates,
      processed_at: updates.status === 'completed' ? new Date().toISOString() : currentPayout.processed_at,
    };

    const { data, error } = await supabase
      .from('payouts')
      .update(updateData as never)
      .eq('id', id)
      .select('*, agents(id, first_name, last_name, email, agent_code)')
      .single();

    if (error) {
      console.error('Payout update error:', error);
      return serverErrorResponse();
    }

    // Send notification emails based on status change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentInfo = (data as any)?.agents as { first_name: string; last_name: string; email: string } | null;
    if (agentInfo && updates.status) {
      const agentName = agentInfo.first_name || 'Agent';
      const agentEmail = agentInfo.email;
      const payoutAmount = currentPayout.net_amount;
      const paymentMethod = currentPayout.method.toUpperCase();

      if (updates.status === 'processing' || updates.status === 'completed') {
        // Send processing/completed notification
        sendPayoutNotification({
          to: agentEmail,
          agentName,
          amount: payoutAmount,
          status: updates.status,
          paymentMethod,
          expectedDate: updates.status === 'processing' ? '1-5 business days' : undefined,
        }).catch((err) => {
          console.error('Failed to send payout notification email:', err);
        });
      } else if (updates.status === 'failed') {
        // Send rejection notification
        sendWithdrawalRejected({
          to: agentEmail,
          agentName,
          amount: currentPayout.amount,
          paymentMethod,
          reason: 'Your withdrawal request could not be processed. The funds have been returned to your wallet balance.',
        }).catch((err) => {
          console.error('Failed to send withdrawal rejected email:', err);
        });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin payout PATCH error:', error);
    return serverErrorResponse();
  }
}
