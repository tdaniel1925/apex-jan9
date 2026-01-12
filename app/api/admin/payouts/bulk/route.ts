/**
 * Admin Bulk Payouts API
 * POST - Process multiple payouts at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Payout, Wallet } from '@/lib/types/database';

// Bulk action schema
const bulkActionSchema = z.object({
  payout_ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['process', 'complete', 'fail']),
});

interface BulkResult {
  success: boolean;
  payout_id: string;
  previous_status: string;
  new_status: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = bulkActionSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { payout_ids, action } = parseResult.data;
    const results: BulkResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Map action to new status
    const statusMap = {
      process: 'processing',
      complete: 'completed',
      fail: 'failed',
    };
    const newStatus = statusMap[action];

    // Get all payouts
    const { data: payoutsData, error: fetchError } = await supabase
      .from('payouts')
      .select('*')
      .in('id', payout_ids);

    if (fetchError) {
      console.error('Payouts fetch error:', fetchError);
      return serverErrorResponse();
    }

    const payouts = (payoutsData || []) as Payout[];
    const payoutsById = new Map(payouts.map(p => [p.id, p]));

    // Process each payout
    for (const payoutId of payout_ids) {
      const payout = payoutsById.get(payoutId);

      if (!payout) {
        results.push({
          success: false,
          payout_id: payoutId,
          previous_status: 'unknown',
          new_status: newStatus,
          error: 'Payout not found',
        });
        errorCount++;
        continue;
      }

      // Validate state transition
      const validTransitions: Record<string, string[]> = {
        pending: ['processing', 'completed', 'failed'],
        processing: ['completed', 'failed'],
        completed: [],
        failed: [],
      };

      if (!validTransitions[payout.status]?.includes(newStatus)) {
        results.push({
          success: false,
          payout_id: payoutId,
          previous_status: payout.status,
          new_status: newStatus,
          error: `Cannot transition from ${payout.status} to ${newStatus}`,
        });
        errorCount++;
        continue;
      }

      try {
        // Handle failed status - restore wallet balance
        if (action === 'fail') {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('*')
            .eq('agent_id', payout.agent_id)
            .single();

          if (walletData) {
            const wallet = walletData as Wallet;
            await supabase
              .from('wallets')
              .update({
                balance: wallet.balance + payout.amount,
                updated_at: new Date().toISOString(),
              } as never)
              .eq('agent_id', payout.agent_id);

            await supabase.from('wallet_transactions').insert({
              agent_id: payout.agent_id,
              type: 'credit',
              category: 'adjustment',
              amount: payout.amount,
              balance_after: wallet.balance + payout.amount,
              description: `Payout failed - funds restored`,
              reference_type: 'payout',
              reference_id: payoutId,
            } as never);
          }
        }

        // Update payout
        const { error: updateError } = await supabase
          .from('payouts')
          .update({
            status: newStatus,
            processed_at: action === 'complete' ? new Date().toISOString() : undefined,
          } as never)
          .eq('id', payoutId);

        if (updateError) {
          results.push({
            success: false,
            payout_id: payoutId,
            previous_status: payout.status,
            new_status: newStatus,
            error: updateError.message,
          });
          errorCount++;
        } else {
          results.push({
            success: true,
            payout_id: payoutId,
            previous_status: payout.status,
            new_status: newStatus,
          });
          successCount++;
        }
      } catch (error) {
        results.push({
          success: false,
          payout_id: payoutId,
          previous_status: payout.status,
          new_status: newStatus,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      summary: {
        total: payout_ids.length,
        success: successCount,
        errors: errorCount,
        action,
      },
      results,
    });
  } catch (error) {
    console.error('Admin bulk payouts error:', error);
    return serverErrorResponse();
  }
}
