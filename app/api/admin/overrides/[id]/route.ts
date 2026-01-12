/**
 * Admin Single Override API
 * GET - Get override details
 * PATCH - Update override (e.g., reverse)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Override, Wallet } from '@/lib/types/database';

// Update schema
const updateOverrideSchema = z.object({
  status: z.enum(['pending', 'paid', 'reversed']).optional(),
  override_amount: z.number().positive().optional(),
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
      .from('overrides')
      .select(`
        *,
        agent:agents!overrides_agent_id_fkey(id, first_name, last_name, email, agent_code, rank),
        source_agent:agents!overrides_source_agent_id_fkey(id, first_name, last_name, email, agent_code),
        commission:commissions(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return notFoundResponse('Override not found');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin override GET error:', error);
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
    const parseResult = updateOverrideSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = parseResult.data;

    // Get current override
    const { data: currentData, error: fetchError } = await supabase
      .from('overrides')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      return notFoundResponse('Override not found');
    }

    const currentOverride = currentData as Override;

    // Handle reversals - debit from wallet
    if (updates.status === 'reversed' && currentOverride.status !== 'reversed') {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('agent_id', currentOverride.agent_id)
        .single();

      if (walletData) {
        const wallet = walletData as Wallet;
        const newBalance = Math.max(0, wallet.balance - currentOverride.override_amount);

        await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            lifetime_earnings: Math.max(0, wallet.lifetime_earnings - currentOverride.override_amount),
            updated_at: new Date().toISOString(),
          } as never)
          .eq('agent_id', currentOverride.agent_id);

        // Create reversal transaction
        await supabase.from('wallet_transactions').insert({
          agent_id: currentOverride.agent_id,
          type: 'debit',
          category: 'adjustment',
          amount: currentOverride.override_amount,
          balance_after: newBalance,
          description: `Override reversed - Gen ${currentOverride.generation}`,
          reference_type: 'override',
          reference_id: id,
        } as never);
      }
    }

    // Update override
    const { data, error } = await supabase
      .from('overrides')
      .update(updates as never)
      .eq('id', id)
      .select(`
        *,
        agent:agents!overrides_agent_id_fkey(id, first_name, last_name, agent_code),
        source_agent:agents!overrides_source_agent_id_fkey(id, first_name, last_name, agent_code)
      `)
      .single();

    if (error) {
      console.error('Override update error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin override PATCH error:', error);
    return serverErrorResponse();
  }
}
