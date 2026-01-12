/**
 * Admin Payout Process API
 * POST - Mark payout as processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { sendPayoutNotification } from '@/lib/email/email-service';
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

    // Only allow processing pending payouts
    if (payout.status !== 'pending') {
      return badRequestResponse(`Cannot process a ${payout.status} payout`);
    }

    // Update to processing
    const { data, error } = await supabase
      .from('payouts')
      .update({
        status: 'processing',
      } as never)
      .eq('id', id)
      .select('*, agents(id, first_name, last_name, email, agent_code)')
      .single();

    if (error) {
      console.error('Payout process error:', error);
      return serverErrorResponse();
    }

    // Send email notification
    if (payout.agents?.email) {
      await sendPayoutNotification({
        to: payout.agents.email,
        agentName: payout.agents.first_name || 'Agent',
        amount: payout.net_amount,
        status: 'processing',
        paymentMethod: payout.method === 'ach' ? 'Bank Transfer (ACH)' : payout.method === 'wire' ? 'Wire Transfer' : 'Check',
        expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
      }).catch((error) => {
        // Log but don't fail request if email fails
        console.error('Failed to send payout email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      payout: data,
      message: 'Payout marked as processing',
    });
  } catch (error) {
    console.error('Admin payout process error:', error);
    return serverErrorResponse();
  }
}
