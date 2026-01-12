import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient } from '@/lib/db/supabase-server';
import {
  validateWithdrawal,
  calculateNetWithdrawal,
  createWithdrawalTransaction,
  createPayoutRecord,
} from '@/lib/engines/wallet-engine';
import type { Agent, Wallet, Payout } from '@/lib/types/database';

// Zod schema for withdrawal request
const withdrawSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['ach', 'wire', 'check'], {
    message: 'Invalid withdrawal method',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent with explicit typing
    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = withdrawSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, method } = parseResult.data;

    // Get wallet with explicit typing
    const { data: walletData, error: walletError } = await adminClient
      .from('wallets')
      .select('*')
      .eq('agent_id', agent.id)
      .single();

    if (walletError || !walletData) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const wallet = walletData as Wallet;

    // Validate withdrawal
    const validation = validateWithdrawal(wallet, { amount, method });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Calculate amounts
    const { gross, fee, net } = calculateNetWithdrawal(amount, method);

    // Create payout record
    const payoutRecord = createPayoutRecord(agent.id, { amount, method });
    const { data: payoutData, error: payoutError } = await adminClient
      .from('payouts')
      .insert(payoutRecord as never)
      .select()
      .single();

    if (payoutError) {
      console.error('Payout create error:', payoutError);
      return NextResponse.json(
        { error: 'Failed to create payout' },
        { status: 500 }
      );
    }

    const payout = payoutData as Payout;

    // Create transaction record
    const transactionRecord = createWithdrawalTransaction(agent.id, wallet, {
      amount,
      method,
    });
    transactionRecord.reference_id = payout.id;

    await adminClient.from('wallet_transactions').insert(transactionRecord as never);

    // Update wallet balance
    await adminClient
      .from('wallets')
      .update({ balance: wallet.balance - amount } as never)
      .eq('agent_id', agent.id);

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        gross,
        fee,
        net,
        method,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Withdraw POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
