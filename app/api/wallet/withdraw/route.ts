import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServerSupabaseClient, createAdminClient } from '@/lib/db/supabase-server';
import {
  validateWithdrawal,
  calculateNetWithdrawal,
  createWithdrawalTransaction,
  createPayoutRecord,
} from '@/lib/engines/wallet-engine';
import {
  validateWithdrawalLimits,
  logWithdrawalAttempt,
} from '@/lib/services/withdrawal-limits';
import { sendWithdrawalRequest } from '@/lib/email/email-service';
import type { Agent, Wallet, Payout } from '@/lib/types/database';

// Estimated days for each withdrawal method
const ESTIMATED_DAYS: Record<string, string> = {
  ach: '3-5 business days',
  wire: '1-2 business days',
  check: '7-10 business days',
};

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
      .select('id, email, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id' | 'email' | 'first_name' | 'last_name'>;

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

    // Get request metadata for audit logging
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

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

    // Validate withdrawal amount and balance
    const validation = validateWithdrawal(wallet, { amount, method });
    if (!validation.valid) {
      // Log failed attempt
      await logWithdrawalAttempt(
        adminClient,
        agent.id,
        'request',
        amount,
        method,
        undefined,
        validation.error,
        ipAddress,
        userAgent
      );
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate withdrawal limits (rate limiting, banking info, etc.)
    const limitsCheck = await validateWithdrawalLimits(adminClient, agent.id, amount, method);
    if (!limitsCheck.allowed) {
      // Log failed attempt
      await logWithdrawalAttempt(
        adminClient,
        agent.id,
        'request',
        amount,
        method,
        undefined,
        limitsCheck.reason,
        ipAddress,
        userAgent
      );
      return NextResponse.json({ error: limitsCheck.reason }, { status: 400 });
    }

    // Calculate amounts
    const { gross, fee, net } = calculateNetWithdrawal(amount, method);

    // FIXED: Lock funds atomically to prevent race condition
    const { data: lockResult, error: lockError } = await adminClient.rpc(
      'lock_withdrawal_funds',
      {
        p_agent_id: agent.id,
        p_amount: amount,
      } as any
    );

    if (lockError || !lockResult) {
      console.error('Failed to lock withdrawal funds:', lockError);
      await logWithdrawalAttempt(
        adminClient,
        agent.id,
        'request',
        amount,
        method,
        undefined,
        'Insufficient funds (concurrent withdrawal detected)',
        ipAddress,
        userAgent
      );
      return NextResponse.json(
        {
          error:
            'Unable to process withdrawal. Please check your available balance and try again.',
        },
        { status: 400 }
      );
    }

    // Create payout record (funds are now locked)
    const payoutRecord = createPayoutRecord(agent.id, { amount, method });
    const { data: payoutData, error: payoutError } = await adminClient
      .from('payouts')
      .insert(payoutRecord as never)
      .select()
      .single();

    if (payoutError) {
      console.error('Payout create error:', payoutError);
      // Unlock funds since payout creation failed
      await adminClient.rpc('unlock_withdrawal_funds', {
        p_agent_id: agent.id,
        p_amount: amount,
        p_deduct_from_balance: false,
      } as any);
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

    // NOTE: Wallet balance is NO LONGER updated here
    // The database trigger will handle unlocking/deducting when payout status changes to 'completed'
    // This prevents the race condition where multiple withdrawals could be processed simultaneously

    // Log successful withdrawal request
    await logWithdrawalAttempt(
      adminClient,
      agent.id,
      'request',
      amount,
      method,
      payout.id,
      'Withdrawal request submitted successfully',
      ipAddress,
      userAgent
    );

    // Send confirmation email (non-blocking)
    sendWithdrawalRequest({
      to: agent.email,
      agentName: agent.first_name || 'Agent',
      amount: gross,
      netAmount: net,
      fee,
      paymentMethod: method.toUpperCase(),
      estimatedDays: ESTIMATED_DAYS[method],
    }).catch((err) => {
      console.error('Failed to send withdrawal request email:', err);
    });

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
      limits: limitsCheck.limits, // Include remaining limits in response
    });
  } catch (error) {
    console.error('Withdraw POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
