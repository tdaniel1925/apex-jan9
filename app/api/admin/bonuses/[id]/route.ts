/**
 * Admin Single Bonus API
 * GET - Get bonus details
 * PATCH - Update bonus status (approve, cancel, etc.)
 * DELETE - Delete pending bonus
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { createCreditTransaction, calculateCreditUpdate } from '@/lib/engines/wallet-engine';
import type { Bonus, Wallet } from '@/lib/types/database';

// Update schema
const updateBonusSchema = z.object({
  status: z.enum(['pending', 'approved', 'paid', 'cancelled']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  payout_date: z.string().nullable().optional(),
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
      .from('bonuses')
      .select('*, agents(id, first_name, last_name, email, agent_code, rank)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return notFoundResponse('Bonus not found');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin bonus GET error:', error);
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
    const parseResult = updateBonusSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = parseResult.data;

    // Get current bonus
    const { data: currentData, error: fetchError } = await supabase
      .from('bonuses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      return notFoundResponse('Bonus not found');
    }

    const currentBonus = currentData as Bonus;

    // Can't modify paid or cancelled bonuses
    if (currentBonus.status === 'paid' || currentBonus.status === 'cancelled') {
      return badRequestResponse(`Cannot modify a ${currentBonus.status} bonus`);
    }

    // Check if transitioning to approved from pending
    const transitioningToApproved =
      updates.status === 'approved' && currentBonus.status === 'pending';

    // Update bonus
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      payout_date: transitioningToApproved && !updates.payout_date
        ? new Date().toISOString()
        : updates.payout_date,
    };

    const { data, error } = await supabase
      .from('bonuses')
      .update(updateData as never)
      .eq('id', id)
      .select('*, agents(id, first_name, last_name, email, agent_code)')
      .single();

    if (error) {
      console.error('Bonus update error:', error);
      return serverErrorResponse();
    }

    // Credit wallet if transitioning to approved
    let walletCredited = false;
    if (transitioningToApproved) {
      walletCredited = await creditAgentWallet(
        supabase,
        currentBonus.agent_id,
        currentBonus.amount,
        currentBonus.description
      );
    }

    return NextResponse.json({
      bonus: data,
      wallet_credited: walletCredited,
    });
  } catch (error) {
    console.error('Admin bonus PATCH error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get current bonus
    const { data: currentData, error: fetchError } = await supabase
      .from('bonuses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      return notFoundResponse('Bonus not found');
    }

    const currentBonus = currentData as Bonus;

    // Only allow deleting pending bonuses
    if (currentBonus.status !== 'pending') {
      return badRequestResponse(
        `Cannot delete a ${currentBonus.status} bonus. Cancel it instead.`
      );
    }

    const { error } = await supabase
      .from('bonuses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Bonus delete error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('Admin bonus DELETE error:', error);
    return serverErrorResponse();
  }
}

// Helper to credit wallet
async function creditAgentWallet(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  amount: number,
  description: string
): Promise<boolean> {
  try {
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (walletError || !walletData) {
      await supabase.from('wallets').insert({
        agent_id: agentId,
        balance: amount,
        pending_balance: 0,
        lifetime_earnings: amount,
      } as never);
      return true;
    }

    const wallet = walletData as Wallet;
    const updates = calculateCreditUpdate(wallet, amount, false);

    await supabase
      .from('wallets')
      .update(updates as never)
      .eq('agent_id', agentId);

    const transaction = createCreditTransaction(
      agentId,
      wallet.balance,
      amount,
      'bonus',
      description,
      'bonus',
      undefined
    );

    await supabase.from('wallet_transactions').insert(transaction as never);

    return true;
  } catch (error) {
    console.error('Credit wallet error:', error);
    return false;
  }
}
