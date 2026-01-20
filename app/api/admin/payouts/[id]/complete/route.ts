/**
 * Admin Payout Complete API
 * POST - Mark payout as completed
 *
 * Phase 2 - Issue #16: Added admin audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { sendPayoutNotification } from '@/lib/email/email-service';
import { logAdminAction, AdminActions, ResourceTypes } from '@/lib/audit/admin-logger';
import type { Payout } from '@/lib/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get current payout
    const { data: payoutData, error: fetchError } = await supabase
      .from('payouts')
      .select('*, agents(id, first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !payoutData) {
      return notFoundResponse('Payout not found');
    }

    const payout = payoutData as Payout & { agents: { id: string; first_name: string; last_name: string; email: string } };

    // Only allow completing processing payouts
    if (payout.status !== 'processing' && payout.status !== 'pending') {
      return badRequestResponse(`Cannot complete a ${payout.status} payout`);
    }

    // Update to completed
    const { data, error} = await supabase
      .from('payouts')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select('*, agents(id, first_name, last_name, email, agent_code)')
      .single();

    if (error) {
      console.error('Payout complete error:', error);
      return serverErrorResponse();
    }

    // PHASE 2: Log admin action for compliance audit trail
    await logAdminAction({
      adminId: admin.userId,
      adminEmail: admin.agent.email || `admin_${admin.userId}`,
      action: AdminActions.COMPLETE_PAYOUT,
      resourceType: ResourceTypes.PAYOUT,
      resourceId: id,
      changes: {
        before: { status: payout.status },
        after: { status: 'completed' },
        fields: ['status', 'processed_at'],
      },
      metadata: {
        amount: payout.net_amount,
        agent_id: payout.agent_id,
        method: payout.method,
      },
    }, request);

    // Send email notification
    if (payout.agents?.email) {
      await sendPayoutNotification({
        to: payout.agents.email,
        agentName: payout.agents.first_name || 'Agent',
        amount: payout.net_amount,
        status: 'completed',
        paymentMethod: payout.method === 'ach' ? 'Bank Transfer (ACH)' : payout.method === 'wire' ? 'Wire Transfer' : 'Check',
      }).catch((error) => {
        // Log but don't fail request if email fails
        console.error('Failed to send payout email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      payout: data,
      message: `Payout of $${payout.net_amount} completed successfully`,
    });
  } catch (error) {
    console.error('Admin payout complete error:', error);
    return serverErrorResponse();
  }
}
