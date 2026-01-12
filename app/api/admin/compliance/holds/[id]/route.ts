/**
 * Admin Compliance Hold Detail API
 * GET - Get hold details
 * PATCH - Update hold (review, approve, reject, escalate)
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
import { formatComplianceHoldSummary } from '@/lib/engines/compliance-engine';
import type { ComplianceHold, ComplianceHoldStatus } from '@/lib/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Update schema
const updateSchema = z.object({
  action: z.enum(['review', 'approve', 'reject', 'escalate', 'submit_document']),
  notes: z.string().optional(),
  resolution: z.string().optional(),
  document_name: z.string().optional(),
  document_url: z.string().url().optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createUntypedAdminClient();

    const { data: hold, error } = await supabase
      .from('compliance_holds')
      .select(
        `
        *,
        agent:agents(
          id, first_name, last_name, agent_code, rank, status, email, phone,
          premium_90_days, persistency_rate, placement_rate
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !hold) {
      return notFoundResponse('Compliance hold not found');
    }

    // Get agent's recent activity for context
    const { data: recentCommissions } = await supabase
      .from('commissions')
      .select('id, premium_amount, commission_amount, policy_date, status')
      .eq('agent_id', hold.agent_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get related clawbacks
    const { data: clawbacks } = await supabase
      .from('clawbacks')
      .select('id, clawback_type, clawback_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Check documentation completeness
    const requiredDocs = hold.documentation_required || [];
    const providedDocs = hold.documentation_provided || [];
    const documentationComplete = requiredDocs.length > 0 && requiredDocs.length <= providedDocs.length;

    return NextResponse.json({
      hold,
      recentCommissions: recentCommissions || [],
      clawbacks: clawbacks || [],
      documentationStatus: {
        required: requiredDocs.length,
        provided: providedDocs.length,
        complete: documentationComplete,
      },
      summary: formatComplianceHoldSummary(hold as unknown as Parameters<typeof formatComplianceHoldSummary>[0]),
    });
  } catch (error) {
    console.error('Admin compliance hold GET error:', error);
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

    const { action, notes, resolution, document_name, document_url } = parseResult.data;

    // Fetch current hold
    const { data: hold, error: fetchError } = await supabase
      .from('compliance_holds')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !hold) {
      return notFoundResponse('Compliance hold not found');
    }

    // Handle different actions
    switch (action) {
      case 'review':
        return await reviewHold(supabase, hold, admin.agentId, notes);

      case 'approve':
        return await approveHold(supabase, hold, admin.agentId, resolution, notes);

      case 'reject':
        return await rejectHold(supabase, hold, admin.agentId, resolution, notes);

      case 'escalate':
        return await escalateHold(supabase, hold, admin.agentId, notes);

      case 'submit_document':
        return await submitDocument(supabase, hold, document_name, document_url);

      default:
        return badRequestResponse('Invalid action');
    }
  } catch (error) {
    console.error('Admin compliance hold PATCH error:', error);
    return serverErrorResponse();
  }
}

async function reviewHold(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  hold: ComplianceHold,
  reviewerId: string,
  notes?: string
) {
  if (hold.status !== 'pending') {
    return badRequestResponse('Only pending holds can be reviewed');
  }

  const updateData: Partial<ComplianceHold> = {
    status: 'under_review',
    assigned_to: reviewerId,
    notes: notes ? (hold.notes ? `${hold.notes}\n---\n${notes}` : notes) : hold.notes,
  };

  const { data: updated, error } = await supabase
    .from('compliance_holds')
    .update(updateData)
    .eq('id', hold.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  return NextResponse.json({
    hold: updated,
    message: 'Hold is now under review',
  });
}

async function approveHold(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  hold: ComplianceHold,
  reviewerId: string,
  resolution?: string,
  notes?: string
) {
  if (!['pending', 'under_review'].includes(hold.status)) {
    return badRequestResponse('Only pending or under review holds can be approved');
  }

  const updateData: Partial<ComplianceHold> = {
    status: 'approved',
    resolution: resolution || 'Approved',
    resolved_at: new Date().toISOString(),
    resolved_by: reviewerId,
    notes: notes ? (hold.notes ? `${hold.notes}\n---\n${notes}` : notes) : hold.notes,
  };

  const { data: updated, error } = await supabase
    .from('compliance_holds')
    .update(updateData)
    .eq('id', hold.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  // Release held amount if any
  if (hold.affected_amount > 0) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('agent_id', hold.agent_id)
      .single();

    const newBalance = (wallet?.balance || 0) + hold.affected_amount;

    await supabase.from('wallets').update({ balance: newBalance }).eq('agent_id', hold.agent_id);

    await supabase.from('wallet_transactions').insert({
      agent_id: hold.agent_id,
      type: 'credit',
      category: 'hold_release',
      amount: hold.affected_amount,
      balance_after: newBalance,
      description: `Compliance hold approved - funds released: ${hold.id}`,
      reference_type: 'compliance_hold',
      reference_id: hold.id,
    });
  }

  // Reactivate agent if they were deactivated
  await supabase
    .from('agents')
    .update({ status: 'active' })
    .eq('id', hold.agent_id)
    .eq('status', 'compliance_hold');

  return NextResponse.json({
    hold: updated,
    amountReleased: hold.affected_amount,
    message: 'Hold approved and funds released',
  });
}

async function rejectHold(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  hold: ComplianceHold,
  reviewerId: string,
  resolution?: string,
  notes?: string
) {
  if (!['pending', 'under_review'].includes(hold.status)) {
    return badRequestResponse('Only pending or under review holds can be rejected');
  }

  const updateData: Partial<ComplianceHold> = {
    status: 'rejected',
    resolution: resolution || 'Rejected - compliance requirements not met',
    resolved_at: new Date().toISOString(),
    resolved_by: reviewerId,
    notes: notes ? (hold.notes ? `${hold.notes}\n---\n${notes}` : notes) : hold.notes,
  };

  const { data: updated, error } = await supabase
    .from('compliance_holds')
    .update(updateData)
    .eq('id', hold.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  // Agent remains in compliance_hold status - funds not released
  return NextResponse.json({
    hold: updated,
    message: 'Hold rejected - agent remains on compliance hold',
  });
}

async function escalateHold(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  hold: ComplianceHold,
  escalatedBy: string,
  notes?: string
) {
  if (!['pending', 'under_review'].includes(hold.status)) {
    return badRequestResponse('Only pending or under review holds can be escalated');
  }

  const updateData: Partial<ComplianceHold> = {
    status: 'escalated',
    assigned_to: null, // Clears assignee for escalation queue
    notes: notes
      ? `${hold.notes ? hold.notes + '\n---\n' : ''}ESCALATED by ${escalatedBy}: ${notes}`
      : hold.notes,
  };

  const { data: updated, error } = await supabase
    .from('compliance_holds')
    .update(updateData)
    .eq('id', hold.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  // Deactivate agent for escalated holds
  await supabase.from('agents').update({ status: 'compliance_hold' }).eq('id', hold.agent_id);

  return NextResponse.json({
    hold: updated,
    message: 'Hold escalated. Agent has been placed on compliance hold pending senior review.',
  });
}

async function submitDocument(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  hold: ComplianceHold,
  documentName?: string,
  documentUrl?: string
) {
  if (!documentName || !documentUrl) {
    return badRequestResponse('Document name and URL are required');
  }

  const updatedDocs = [...(hold.documentation_provided || []), `${documentName}:${documentUrl}`];

  const { data: updated, error } = await supabase
    .from('compliance_holds')
    .update({
      documentation_provided: updatedDocs,
    })
    .eq('id', hold.id)
    .select()
    .single();

  if (error) {
    return serverErrorResponse();
  }

  return NextResponse.json({
    hold: updated,
    message: 'Document submitted',
  });
}
