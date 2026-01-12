/**
 * Admin Bonuses API
 * GET - List all bonuses with filters
 * POST - Create a manual bonus
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { createCreditTransaction, calculateCreditUpdate } from '@/lib/engines/wallet-engine';
import type { BonusType, Wallet } from '@/lib/types/database';

// Query result type for stats
interface BonusStatRow {
  amount: number | null;
  status: string;
  bonus_type: BonusType;
}

// Valid bonus types
const BONUS_TYPES: BonusType[] = [
  'fast_start',
  'fast_start_sponsor',
  'rank_advancement',
  'ai_copilot_personal',
  'ai_copilot_referral',
  'ai_copilot_team',
  'matching',
  'car',
  'leadership_pool',
  'contest',
];

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  agent_id: z.string().uuid().optional(),
  bonus_type: z.enum(BONUS_TYPES as [BonusType, ...BonusType[]]).optional(),
  status: z.enum(['pending', 'approved', 'paid', 'cancelled']).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

// Create bonus schema
const createBonusSchema = z.object({
  agent_id: z.string().uuid(),
  bonus_type: z.enum(BONUS_TYPES as [BonusType, ...BonusType[]]),
  amount: z.number().positive(),
  description: z.string().min(1),
  reference_id: z.string().nullable().optional(),
  status: z.enum(['pending', 'approved', 'paid', 'cancelled']).default('pending'),
  payout_date: z.string().nullable().optional(),
  auto_credit: z.boolean().default(false), // If true, immediately credit wallet
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { limit, offset, agent_id, bonus_type, status, from_date, to_date } = parseResult.data;

    // Build query
    let query = supabase
      .from('bonuses')
      .select('*, agents(id, first_name, last_name, email, agent_code, rank)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (bonus_type) {
      query = query.eq('bonus_type', bonus_type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (from_date) {
      query = query.gte('created_at', from_date);
    }

    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Bonuses fetch error:', error);
      return serverErrorResponse();
    }

    // Calculate summary stats
    const { data: statsData } = await supabase
      .from('bonuses')
      .select('amount, status, bonus_type');

    const statsRows = (statsData || []) as BonusStatRow[];
    const stats = {
      totalBonuses: statsRows.length,
      totalAmount: statsRows.reduce((sum, b) => sum + (b.amount || 0), 0),
      pendingCount: statsRows.filter(b => b.status === 'pending').length,
      pendingAmount: statsRows.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.amount || 0), 0),
      approvedCount: statsRows.filter(b => b.status === 'approved').length,
      paidCount: statsRows.filter(b => b.status === 'paid').length,
      byType: BONUS_TYPES.reduce((acc, type) => {
        acc[type] = statsRows.filter(b => b.bonus_type === type).length;
        return acc;
      }, {} as Record<BonusType, number>),
    };

    return NextResponse.json({
      bonuses: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('Admin bonuses GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createBonusSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { auto_credit, ...bonusData } = parseResult.data;

    // Verify agent exists
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id, first_name, last_name')
      .eq('id', bonusData.agent_id)
      .single();

    if (agentError || !agentData) {
      return badRequestResponse('Agent not found');
    }

    // Create bonus
    const { data: bonus, error: createError } = await supabase
      .from('bonuses')
      .insert(bonusData as never)
      .select()
      .single();

    if (createError) {
      console.error('Bonus create error:', createError);
      return serverErrorResponse();
    }

    // Auto credit wallet if requested and status is approved
    let walletCredited = false;
    if (auto_credit && bonusData.status === 'approved') {
      walletCredited = await creditAgentWallet(
        supabase,
        bonusData.agent_id,
        bonusData.amount,
        bonusData.description
      );
    }

    return NextResponse.json({
      bonus,
      wallet_credited: walletCredited,
    }, { status: 201 });
  } catch (error) {
    console.error('Admin bonuses POST error:', error);
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
    // Get current wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (walletError || !walletData) {
      // Create wallet if doesn't exist
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

    // Create transaction record
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
