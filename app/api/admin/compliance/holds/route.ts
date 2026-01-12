/**
 * Admin Compliance Holds API
 * GET - List all compliance holds with filters
 * POST - Create a new compliance hold
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import {
  verifyAdmin,
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
} from '@/lib/auth/admin-auth';
import {
  createComplianceHold,
  getRequiredDocumentation,
  type ComplianceHoldType,
} from '@/lib/engines/compliance-engine';
import type { Agent, ComplianceHoldStatus } from '@/lib/types/database';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'escalated']).optional(),
  hold_type: z
    .enum([
      'new_agent_review',
      'high_volume_threshold',
      'suspicious_activity',
      'documentation_required',
      'regulatory_review',
      'fraud_investigation',
      'family_stacking',
      'circular_sponsorship',
      'rapid_advancement',
    ])
    .optional(),
  agent_id: z.string().uuid().optional(),
  sort_by: z.enum(['created_at', 'affected_amount', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Create hold schema
const createHoldSchema = z.object({
  agent_id: z.string().uuid(),
  hold_type: z.enum([
    'new_agent_review',
    'high_volume_threshold',
    'suspicious_activity',
    'documentation_required',
    'regulatory_review',
    'fraud_investigation',
    'family_stacking',
    'circular_sponsorship',
    'rapid_advancement',
  ]),
  reason: z.string().min(1),
  affected_amount: z.number().min(0).default(0),
  affected_commissions: z.array(z.string().uuid()).default([]),
  affected_payouts: z.array(z.string().uuid()).default([]),
  notes: z.string().default(''),
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createUntypedAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { limit, offset, status, hold_type, agent_id, sort_by, sort_order } = parseResult.data;

    // Build query
    let query = supabase
      .from('compliance_holds')
      .select(
        `
        *,
        agent:agents(id, first_name, last_name, agent_code, rank, status, email)
      `,
        { count: 'exact' }
      )
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (hold_type) {
      query = query.eq('hold_type', hold_type);
    }

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Compliance holds fetch error:', error);
      return serverErrorResponse();
    }

    // Get summary stats
    const { data: statsData } = await supabase
      .from('compliance_holds')
      .select('status, affected_amount');

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter((h) => h.status === 'pending').length || 0,
      underReview: statsData?.filter((h) => h.status === 'under_review').length || 0,
      approved: statsData?.filter((h) => h.status === 'approved').length || 0,
      rejected: statsData?.filter((h) => h.status === 'rejected').length || 0,
      escalated: statsData?.filter((h) => h.status === 'escalated').length || 0,
      totalAffectedAmount: statsData?.reduce((sum, h) => sum + (h.affected_amount || 0), 0) || 0,
    };

    return NextResponse.json({
      holds: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('Admin compliance holds GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createUntypedAdminClient();
    const body = await request.json();
    const parseResult = createHoldSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { agent_id, hold_type, reason, affected_amount, affected_commissions, affected_payouts, notes } =
      parseResult.data;

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      return badRequestResponse('Agent not found');
    }

    // Check for existing active hold of same type
    const { data: existingHold } = await supabase
      .from('compliance_holds')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('hold_type', hold_type)
      .in('status', ['pending', 'under_review'])
      .single();

    if (existingHold) {
      return badRequestResponse(`Agent already has an active ${hold_type} hold`);
    }

    // Create hold using engine
    const holdData = createComplianceHold(
      agent_id,
      hold_type as ComplianceHoldType,
      reason,
      affected_amount,
      affected_commissions,
      affected_payouts
    );

    // Set assigned_to to the admin creating the hold
    holdData.assigned_to = admin.agentId;
    if (notes) {
      holdData.notes = notes;
    }

    // Insert into database
    const { data: createdHold, error: insertError } = await supabase
      .from('compliance_holds')
      .insert(holdData)
      .select()
      .single();

    if (insertError) {
      console.error('Compliance hold insert error:', insertError);
      return serverErrorResponse();
    }

    // If hold type warrants it, update agent status
    if (
      hold_type === 'fraud_investigation' ||
      hold_type === 'suspicious_activity' ||
      hold_type === 'family_stacking'
    ) {
      await supabase.from('agents').update({ status: 'compliance_hold' }).eq('id', agent_id);
    }

    return NextResponse.json(
      {
        hold: createdHold,
        message: `Compliance hold created for ${(agent as Agent).first_name} ${(agent as Agent).last_name}`,
        requiredDocuments: holdData.documentation_required,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin compliance holds POST error:', error);
    return serverErrorResponse();
  }
}
