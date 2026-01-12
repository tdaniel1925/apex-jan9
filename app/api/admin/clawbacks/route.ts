/**
 * Admin Clawbacks API
 * GET - List all clawbacks with filters
 * POST - Create a new clawback
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
  calculateClawbackAmounts,
  createClawbackRecord,
  validateClawback,
  type ClawbackEvent,
} from '@/lib/engines/clawback-engine';
import type { Commission, Override } from '@/lib/types/database';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['pending', 'processed', 'failed']).optional(),
  type: z
    .enum([
      'refund',
      'chargeback',
      'subscription_cancelled',
      'order_cancelled',
      'compliance_violation',
      'fraud',
      'policy_lapse',
      'admin_adjustment',
    ])
    .optional(),
  agent_id: z.string().uuid().optional(),
  sort_by: z.enum(['created_at', 'clawback_amount', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Create clawback schema
const createClawbackSchema = z.object({
  commission_id: z.string().uuid(),
  type: z.enum([
    'refund',
    'chargeback',
    'subscription_cancelled',
    'order_cancelled',
    'compliance_violation',
    'fraud',
    'policy_lapse',
    'admin_adjustment',
  ]),
  reason: z.string().min(1),
  partial_amount: z.number().positive().optional(),
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

    const { limit, offset, status, type, agent_id, sort_by, sort_order } = parseResult.data;

    // Build query
    let query = supabase
      .from('clawbacks')
      .select(
        `
        *,
        commission:commissions(
          id, policy_number, premium_amount, commission_amount,
          agent:agents(id, first_name, last_name, agent_code)
        )
      `,
        { count: 'exact' }
      )
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('clawback_type', type);
    }

    if (agent_id) {
      query = query.eq('commission.agent_id', agent_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Clawbacks fetch error:', error);
      return serverErrorResponse();
    }

    // Get summary stats
    const { data: statsData } = await supabase.from('clawbacks').select('status, clawback_amount');

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter((c) => c.status === 'pending').length || 0,
      processed: statsData?.filter((c) => c.status === 'processed').length || 0,
      failed: statsData?.filter((c) => c.status === 'failed').length || 0,
      totalAmount: statsData?.reduce((sum, c) => sum + (c.clawback_amount || 0), 0) || 0,
    };

    return NextResponse.json({
      clawbacks: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('Admin clawbacks GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createUntypedAdminClient();
    const body = await request.json();
    const parseResult = createClawbackSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { commission_id, type, reason, partial_amount } = parseResult.data;

    // Fetch the commission
    const { data: commission, error: commError } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', commission_id)
      .single();

    if (commError || !commission) {
      return badRequestResponse('Commission not found');
    }

    // Fetch related overrides
    const { data: overrides } = await supabase
      .from('overrides')
      .select('*')
      .eq('commission_id', commission_id);

    // Create clawback event
    const event: ClawbackEvent = {
      type,
      commissionId: commission_id,
      reason,
      initiatedBy: admin.agentId,
      partialAmount: partial_amount,
    };

    // Validate the clawback
    const validation = validateClawback(commission as Commission, event);
    if (!validation.valid) {
      return badRequestResponse('Invalid clawback', validation.errors);
    }

    // Calculate amounts
    const clawbackRatio = partial_amount ? partial_amount / commission.commission_amount : 1.0;
    const amounts = calculateClawbackAmounts(
      commission as Commission,
      (overrides || []) as Override[],
      clawbackRatio
    );

    // Create clawback record
    const record = createClawbackRecord(event, commission as Commission, amounts.totalClawback);

    // Insert into database
    const { data: clawback, error: insertError } = await supabase
      .from('clawbacks')
      .insert({
        commission_id: record.commission_id,
        clawback_type: record.clawback_type,
        original_amount: record.original_amount,
        clawback_amount: record.clawback_amount,
        reason: record.reason,
        initiated_by: record.initiated_by,
        status: record.status,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Clawback insert error:', insertError);
      return serverErrorResponse();
    }

    return NextResponse.json(
      {
        clawback,
        amounts,
        message: 'Clawback created. Process it to debit wallets and reverse commissions.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin clawbacks POST error:', error);
    return serverErrorResponse();
  }
}
