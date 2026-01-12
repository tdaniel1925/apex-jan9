/**
 * Admin Pay Period Detail API
 * GET - Get pay period details with agent payouts
 * PATCH - Update pay period status (lock, process, pay)
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
  canRecordCommission,
  isReadyForPayout,
  calculateAgentPeriodPayout,
  type PayPeriod,
} from '@/lib/engines/pay-period-engine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Update schema
const updateSchema = z.object({
  action: z.enum(['close', 'reopen', 'process', 'pay']),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createUntypedAdminClient();

    // Get pay period
    const { data: payPeriod, error } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payPeriod) {
      return notFoundResponse('Pay period not found');
    }

    // Get commissions in this period
    const { data: commissions } = await supabase
      .from('commissions')
      .select(
        `
        id, agent_id, commission_amount, status,
        agent:agents(id, first_name, last_name, agent_code)
      `
      )
      .gte('created_at', payPeriod.start_date)
      .lte('created_at', payPeriod.end_date);

    // Get overrides in this period
    const { data: overrides } = await supabase
      .from('overrides')
      .select(
        `
        id, agent_id, override_amount, status,
        agent:agents(id, first_name, last_name, agent_code)
      `
      )
      .gte('created_at', payPeriod.start_date)
      .lte('created_at', payPeriod.end_date);

    // Get bonuses in this period
    const { data: bonuses } = await supabase
      .from('bonuses')
      .select(
        `
        id, agent_id, amount, bonus_type, status,
        agent:agents(id, first_name, last_name, agent_code)
      `
      )
      .gte('created_at', payPeriod.start_date)
      .lte('created_at', payPeriod.end_date);

    // Calculate agent payouts
    const agentTotals = new Map<
      string,
      {
        agentId: string;
        agentName: string;
        agentCode: string;
        commissions: number;
        overrides: number;
        bonuses: number;
      }
    >();

    // Aggregate commissions
    for (const comm of commissions || []) {
      const agent = comm.agent as unknown as { id: string; first_name: string; last_name: string; agent_code: string } | null;
      if (!agent) continue;

      const existing = agentTotals.get(comm.agent_id) || {
        agentId: comm.agent_id,
        agentName: `${agent.first_name} ${agent.last_name}`,
        agentCode: agent.agent_code,
        commissions: 0,
        overrides: 0,
        bonuses: 0,
      };
      existing.commissions += comm.commission_amount || 0;
      agentTotals.set(comm.agent_id, existing);
    }

    // Aggregate overrides
    for (const ovr of overrides || []) {
      const agent = ovr.agent as unknown as { id: string; first_name: string; last_name: string; agent_code: string } | null;
      if (!agent) continue;

      const existing = agentTotals.get(ovr.agent_id) || {
        agentId: ovr.agent_id,
        agentName: `${agent.first_name} ${agent.last_name}`,
        agentCode: agent.agent_code,
        commissions: 0,
        overrides: 0,
        bonuses: 0,
      };
      existing.overrides += ovr.override_amount || 0;
      agentTotals.set(ovr.agent_id, existing);
    }

    // Aggregate bonuses
    for (const bonus of bonuses || []) {
      const agent = bonus.agent as unknown as { id: string; first_name: string; last_name: string; agent_code: string } | null;
      if (!agent) continue;

      const existing = agentTotals.get(bonus.agent_id) || {
        agentId: bonus.agent_id,
        agentName: `${agent.first_name} ${agent.last_name}`,
        agentCode: agent.agent_code,
        commissions: 0,
        overrides: 0,
        bonuses: 0,
      };
      existing.bonuses += bonus.amount || 0;
      agentTotals.set(bonus.agent_id, existing);
    }

    // Calculate payouts for each agent
    const agentPayouts = Array.from(agentTotals.values()).map((agent) => {
      const payout = calculateAgentPeriodPayout(
        agent.agentId,
        agent.commissions,
        agent.overrides,
        agent.bonuses
      );

      return {
        ...agent,
        grossPayout: payout.grossPayout,
        holdbackAmount: payout.holdbackAmount,
        netPayout: payout.netPayout,
        meetsMinimum: payout.meetsMinimum,
      };
    });

    // Sort by gross payout descending
    agentPayouts.sort((a, b) => b.grossPayout - a.grossPayout);

    return NextResponse.json({
      payPeriod,
      agentPayouts,
      summary: {
        totalAgents: agentPayouts.length,
        totalCommissions: agentPayouts.reduce((sum, a) => sum + a.commissions, 0),
        totalOverrides: agentPayouts.reduce((sum, a) => sum + a.overrides, 0),
        totalBonuses: agentPayouts.reduce((sum, a) => sum + a.bonuses, 0),
        totalGross: agentPayouts.reduce((sum, a) => sum + a.grossPayout, 0),
        totalHoldback: agentPayouts.reduce((sum, a) => sum + a.holdbackAmount, 0),
        totalNet: agentPayouts.reduce((sum, a) => sum + a.netPayout, 0),
        agentsBelowMinimum: agentPayouts.filter((a) => !a.meetsMinimum).length,
      },
      canRecord: canRecordCommission(payPeriod as PayPeriod),
      readyForPayout: isReadyForPayout(payPeriod as PayPeriod),
    });
  } catch (error) {
    console.error('Admin pay period GET error:', error);
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

    // Get current pay period
    const { data: payPeriod, error: fetchError } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !payPeriod) {
      return notFoundResponse('Pay period not found');
    }

    // Handle different actions
    switch (action) {
      case 'close':
        return await closePayPeriod(supabase, payPeriod as PayPeriod, notes);

      case 'reopen':
        return await reopenPayPeriod(supabase, payPeriod as PayPeriod, notes);

      case 'process':
        return await processPayPeriod(supabase, payPeriod as PayPeriod, notes);

      case 'pay':
        return await payPayPeriod(supabase, payPeriod as PayPeriod, admin.agentId, notes);

      default:
        return badRequestResponse('Invalid action');
    }
  } catch (error) {
    console.error('Admin pay period PATCH error:', error);
    return serverErrorResponse();
  }
}

async function closePayPeriod(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  payPeriod: PayPeriod,
  notes?: string
) {
  if (payPeriod.status !== 'open') {
    return badRequestResponse('Only open periods can be closed');
  }

  // Calculate totals from commissions, overrides, bonuses in period
  const [commResult, ovrResult, bonusResult] = await Promise.all([
    supabase
      .from('commissions')
      .select('commission_amount')
      .gte('created_at', payPeriod.start_date)
      .lte('created_at', payPeriod.end_date)
      .eq('status', 'paid'),
    supabase
      .from('overrides')
      .select('override_amount')
      .gte('created_at', payPeriod.start_date)
      .lte('created_at', payPeriod.end_date)
      .eq('status', 'paid'),
    supabase
      .from('bonuses')
      .select('amount')
      .gte('created_at', payPeriod.start_date)
      .lte('created_at', payPeriod.end_date)
      .eq('status', 'paid'),
  ]);

  const totalCommissions = (commResult.data || []).reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const totalOverrides = (ovrResult.data || []).reduce((sum, o) => sum + (o.override_amount || 0), 0);
  const totalBonuses = (bonusResult.data || []).reduce((sum, b) => sum + (b.amount || 0), 0);

  // Count unique agents
  const { data: agentIds } = await supabase
    .from('commissions')
    .select('agent_id')
    .gte('created_at', payPeriod.start_date)
    .lte('created_at', payPeriod.end_date);

  const uniqueAgents = new Set((agentIds || []).map((a) => a.agent_id)).size;

  const { data: updated, error } = await supabase
    .from('pay_periods')
    .update({
      status: 'closed',
      total_commissions: totalCommissions,
      total_overrides: totalOverrides,
      total_bonuses: totalBonuses,
      total_amount: totalCommissions + totalOverrides + totalBonuses,
      agent_count: uniqueAgents,
    })
    .eq('id', payPeriod.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  return NextResponse.json({
    payPeriod: updated,
    message: 'Pay period closed. No more commissions can be recorded.',
  });
}

async function reopenPayPeriod(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  payPeriod: PayPeriod,
  notes?: string
) {
  if (payPeriod.status !== 'closed') {
    return badRequestResponse('Only closed periods can be reopened');
  }

  const { data: updated, error } = await supabase
    .from('pay_periods')
    .update({ status: 'open' })
    .eq('id', payPeriod.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  return NextResponse.json({
    payPeriod: updated,
    message: 'Pay period reopened. Commissions can be recorded again.',
  });
}

async function processPayPeriod(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  payPeriod: PayPeriod,
  notes?: string
) {
  if (payPeriod.status !== 'closed') {
    return badRequestResponse('Period must be closed before processing');
  }

  const { data: updated, error } = await supabase
    .from('pay_periods')
    .update({ status: 'processing' })
    .eq('id', payPeriod.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  return NextResponse.json({
    payPeriod: updated,
    message: 'Pay period is now processing. Verify totals and proceed to pay.',
  });
}

async function payPayPeriod(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  payPeriod: PayPeriod,
  adminId: string,
  notes?: string
) {
  if (!isReadyForPayout(payPeriod)) {
    return badRequestResponse('Period not ready for payout. Must be processing and past payout date.');
  }

  // Create wallet transactions for all agents
  const { data: commissions } = await supabase
    .from('commissions')
    .select('agent_id, commission_amount')
    .gte('created_at', payPeriod.start_date)
    .lte('created_at', payPeriod.end_date)
    .eq('status', 'paid');

  // Group by agent
  const agentPayouts = new Map<string, number>();
  for (const comm of commissions || []) {
    const current = agentPayouts.get(comm.agent_id) || 0;
    agentPayouts.set(comm.agent_id, current + (comm.commission_amount || 0));
  }

  // Credit each agent's wallet
  for (const [agentId, amount] of agentPayouts) {
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('agent_id', agentId).single();

    const newBalance = (wallet?.balance || 0) + amount;

    await supabase.from('wallets').update({ balance: newBalance }).eq('agent_id', agentId);

    await supabase.from('wallet_transactions').insert({
      agent_id: agentId,
      type: 'credit',
      category: 'commission',
      amount,
      balance_after: newBalance,
      description: `Pay period ${payPeriod.period_number}/${payPeriod.year} payout`,
      reference_type: 'pay_period',
      reference_id: payPeriod.id,
    });
  }

  const { data: updated, error } = await supabase
    .from('pay_periods')
    .update({
      status: 'paid',
    })
    .eq('id', payPeriod.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  return NextResponse.json({
    payPeriod: updated,
    agentsPaid: agentPayouts.size,
    totalPaid: Array.from(agentPayouts.values()).reduce((sum, a) => sum + a, 0),
    message: 'Pay period completed. All agent wallets have been credited.',
  });
}
