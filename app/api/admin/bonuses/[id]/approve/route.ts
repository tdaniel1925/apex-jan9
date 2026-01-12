/**
 * Admin Bonus Approve API
 * POST - Approve a pending bonus and credit wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { createCreditTransaction, calculateCreditUpdate } from '@/lib/engines/wallet-engine';
import { sendBonusApproval } from '@/lib/email/email-service';
import type { Bonus, Wallet } from '@/lib/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get current bonus
    const { data: bonusData, error: fetchError } = await supabase
      .from('bonuses')
      .select('*, agents(id, first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !bonusData) {
      return notFoundResponse('Bonus not found');
    }

    const bonus = bonusData as Bonus & { agents: { id: string; first_name: string; last_name: string; email: string } };

    // Only allow approving pending bonuses
    if (bonus.status !== 'pending') {
      return badRequestResponse(`Cannot approve a ${bonus.status} bonus`);
    }

    // Update bonus status
    const { data: updatedBonus, error: updateError } = await supabase
      .from('bonuses')
      .update({
        status: 'approved',
        payout_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Bonus approve error:', updateError);
      return serverErrorResponse();
    }

    // Credit wallet
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', bonus.agent_id)
      .single();

    if (walletData) {
      const wallet = walletData as Wallet;
      const updates = calculateCreditUpdate(wallet, bonus.amount, false);

      await supabase
        .from('wallets')
        .update(updates as never)
        .eq('agent_id', bonus.agent_id);

      const transaction = createCreditTransaction(
        bonus.agent_id,
        wallet.balance,
        bonus.amount,
        'bonus',
        bonus.description,
        'bonus',
        id
      );

      await supabase.from('wallet_transactions').insert(transaction as never);
    } else {
      // Create wallet if doesn't exist
      await supabase.from('wallets').insert({
        agent_id: bonus.agent_id,
        balance: bonus.amount,
        pending_balance: 0,
        lifetime_earnings: bonus.amount,
      } as never);
    }

    // Send email notification
    if (bonus.agents?.email) {
      await sendBonusApproval({
        to: bonus.agents.email,
        agentName: bonus.agents.first_name || 'Agent',
        bonusType: bonus.bonus_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount: bonus.amount,
        reason: bonus.description,
      }).catch((error) => {
        // Log but don't fail request if email fails
        console.error('Failed to send bonus email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      bonus: updatedBonus,
      message: `Bonus of $${bonus.amount} approved and credited to wallet`,
    });
  } catch (error) {
    console.error('Admin bonus approve error:', error);
    return serverErrorResponse();
  }
}
