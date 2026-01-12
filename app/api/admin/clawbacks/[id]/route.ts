/**
 * Admin Clawback Detail API
 * GET - Get clawback details
 * PATCH - Update clawback status (process or fail)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import {
  verifyAdmin,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
} from '@/lib/auth/admin-auth';
import {
  calculateClawbackAmounts,
  createClawbackDebitTransactions,
  checkDemotionAfterClawback,
  formatClawbackSummary,
  type ClawbackResult,
} from '@/lib/engines/clawback-engine';
import type { Commission, Override, Agent, ClawbackStatus } from '@/lib/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Update schema
const updateSchema = z.object({
  action: z.enum(['process', 'fail']),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createUntypedAdminClient();

    const { data: clawback, error } = await supabase
      .from('clawbacks')
      .select(
        `
        *,
        commission:commissions(
          *,
          agent:agents(id, first_name, last_name, agent_code, rank, status)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !clawback) {
      return notFoundResponse('Clawback not found');
    }

    // Get related overrides
    const { data: overrides } = await supabase
      .from('overrides')
      .select(
        `
        *,
        agent:agents(id, first_name, last_name, agent_code)
      `
      )
      .eq('commission_id', clawback.commission_id);

    return NextResponse.json({
      clawback,
      overrides: overrides || [],
    });
  } catch (error) {
    console.error('Admin clawback GET error:', error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createUntypedAdminClient();
    const body = await request.json();
    const parseResult = updateSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Invalid request', parseResult.error.flatten());
    }

    const { action, notes } = parseResult.data;

    // Fetch clawback with commission and agent
    const { data: clawback, error: fetchError } = await supabase
      .from('clawbacks')
      .select(
        `
        *,
        commission:commissions(*, agent:agents(*))
      `
      )
      .eq('id', id)
      .single();

    if (fetchError || !clawback) {
      return notFoundResponse('Clawback not found');
    }

    // Handle different actions
    switch (action) {
      case 'process':
        return await processClawback(supabase, clawback, admin.agentId);

      case 'fail':
        return await failClawback(supabase, id);

      default:
        return badRequestResponse('Invalid action');
    }
  } catch (error) {
    console.error('Admin clawback PATCH error:', error);
    return serverErrorResponse();
  }
}

async function processClawback(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  clawback: {
    id: string;
    status: ClawbackStatus;
    clawback_amount: number;
    commission_id: string;
    commission: (Commission & { agent: Agent | null }) | null;
  },
  adminId: string
) {
  if (clawback.status !== 'pending') {
    return badRequestResponse('Clawback must be pending to process');
  }

  const commission = clawback.commission;
  const agent = commission?.agent;

  if (!commission || !agent) {
    return badRequestResponse('Missing commission or agent data');
  }

  // Fetch overrides
  const { data: overrides } = await supabase
    .from('overrides')
    .select('*')
    .eq('commission_id', clawback.commission_id);

  // Calculate amounts
  const clawbackRatio = clawback.clawback_amount / commission.commission_amount;
  const amounts = calculateClawbackAmounts(
    commission,
    (overrides || []) as Override[],
    clawbackRatio
  );

  // Get agent's current wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('agent_id', agent.id)
    .single();

  const currentBalance = wallet?.balance || 0;

  // Create debit transaction for the writing agent
  const agentDebit = createClawbackDebitTransactions(
    agent.id,
    currentBalance,
    amounts.commissionClawback,
    'commission',
    `Clawback: ${clawback.id}`,
    clawback.id
  );

  // Update wallet and create transaction
  const { error: walletError } = await supabase
    .from('wallets')
    .update({ balance: agentDebit.newBalance })
    .eq('agent_id', agent.id);

  if (walletError) {
    console.error('Wallet update error:', walletError);
  }

  // Insert transaction record
  await supabase.from('wallet_transactions').insert({
    agent_id: agentDebit.transaction.agent_id,
    type: agentDebit.transaction.type,
    category: agentDebit.transaction.category,
    amount: agentDebit.transaction.amount,
    balance_after: agentDebit.transaction.balance_after,
    description: agentDebit.transaction.description,
    reference_type: 'clawback',
    reference_id: clawback.id,
  });

  // Process override clawbacks for upline
  const overrideResults = [];
  for (const overrideClawback of amounts.overrideClawbacks) {
    const { data: uplineWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('agent_id', overrideClawback.agentId)
      .single();

    const uplineBalance = uplineWallet?.balance || 0;
    const uplineDebit = createClawbackDebitTransactions(
      overrideClawback.agentId,
      uplineBalance,
      overrideClawback.amount,
      'override',
      `Override clawback: ${clawback.id}`,
      clawback.id
    );

    await supabase
      .from('wallets')
      .update({ balance: uplineDebit.newBalance })
      .eq('agent_id', overrideClawback.agentId);

    await supabase.from('wallet_transactions').insert({
      agent_id: uplineDebit.transaction.agent_id,
      type: uplineDebit.transaction.type,
      category: 'override',
      amount: uplineDebit.transaction.amount,
      balance_after: uplineDebit.transaction.balance_after,
      description: uplineDebit.transaction.description,
      reference_type: 'clawback',
      reference_id: clawback.id,
    });

    overrideResults.push(uplineDebit);
  }

  // Check if agent should be demoted
  const demotionCheck = checkDemotionAfterClawback(agent, amounts.commissionClawback);

  // Update commission status
  await supabase.from('commissions').update({ status: 'reversed' }).eq('id', commission.id);

  // Update overrides status
  await supabase.from('overrides').update({ status: 'reversed' }).eq('commission_id', commission.id);

  // Update clawback status to processed
  const { data: updatedClawback, error: updateError } = await supabase
    .from('clawbacks')
    .update({
      status: 'processed' as ClawbackStatus,
      processed_at: new Date().toISOString(),
    })
    .eq('id', clawback.id)
    .select()
    .single();

  if (updateError) {
    return serverErrorResponse();
  }

  const result: ClawbackResult = {
    success: true,
    commissionReversed: { id: commission.id, amount: amounts.commissionClawback },
    overridesReversed: amounts.overrideClawbacks.map((o) => ({
      id: o.overrideId,
      agentId: o.agentId,
      amount: o.amount,
      generation: o.generation,
    })),
    bonusesReversed: [],
    walletsDebited: [
      { agentId: agent.id, amount: amounts.commissionClawback, category: 'commission' },
      ...overrideResults.map((r) => ({
        agentId: r.transaction.agent_id,
        amount: r.transaction.amount,
        category: 'override' as const,
      })),
    ],
    rankDemoted: demotionCheck.shouldDemote,
    newRank: demotionCheck.newRank || undefined,
    errors: [],
  };

  return NextResponse.json({
    clawback: updatedClawback,
    result,
    summary: formatClawbackSummary(result),
    demotionWarning: demotionCheck.shouldDemote
      ? `Agent may be demoted from ${agent.rank} to ${demotionCheck.newRank}`
      : null,
  });
}

async function failClawback(supabase: ReturnType<typeof createUntypedAdminClient>, id: string) {
  const { data: clawback, error } = await supabase
    .from('clawbacks')
    .update({
      status: 'failed' as ClawbackStatus,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !clawback) {
    return badRequestResponse('Only pending clawbacks can be marked as failed');
  }

  return NextResponse.json({ clawback, message: 'Clawback marked as failed' });
}
