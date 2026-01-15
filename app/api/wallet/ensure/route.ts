/**
 * Wallet Ensure API
 * POST - Ensures the authenticated agent has a wallet, creating one if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/db/supabase-server';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Get agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return ApiErrors.notFound('Agent');
    }

    const typedAgent = agent as { id: string };

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', typedAgent.id)
      .maybeSingle();

    if (existingWallet) {
      return apiSuccess({ wallet: existingWallet, created: false });
    }

    // Create wallet using admin client (bypasses RLS for insert)
    const adminSupabase = createAdminClient();
    const { data: newWallet, error: walletError } = await adminSupabase
      .from('wallets')
      .insert({
        agent_id: typedAgent.id,
        balance: 0,
        pending_balance: 0,
        lifetime_earnings: 0,
      } as never)
      .select()
      .single();

    if (walletError) {
      console.error('Failed to create wallet:', walletError);
      return ApiErrors.internal('Failed to create wallet');
    }

    return apiSuccess({ wallet: newWallet, created: true });
  } catch (error) {
    console.error('Wallet ensure error:', error);
    return ApiErrors.internal();
  }
}
