/**
 * Agent Disputes API
 * GET - List agent's disputes
 * POST - Create a new dispute
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/db/supabase-server';
import { getCurrentAgent } from '@/lib/auth/session';

const DISPUTE_TYPES = ['commission', 'clawback', 'bonus', 'override', 'rank', 'policy', 'other'] as const;

// Type definitions
interface Dispute {
  id: string;
  agent_id: string;
  dispute_type: string;
  subject: string;
  description: string;
  commission_id: string | null;
  clawback_id: string | null;
  bonus_id: string | null;
  status: string;
  priority: string;
  attachments: unknown[];
  amount_disputed: number | null;
  amount_adjusted: number | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Create dispute schema
const createDisputeSchema = z.object({
  dispute_type: z.enum(DISPUTE_TYPES),
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().min(10, 'Please provide more details').max(5000),
  commission_id: z.string().uuid().optional(),
  clawback_id: z.string().uuid().optional(),
  bonus_id: z.string().uuid().optional(),
  amount_disputed: z.number().positive().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const agent = await getCurrentAgent();
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('disputes')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Disputes fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
    }

    const disputes = (data || []) as unknown as Dispute[];

    // Get stats
    const stats = {
      total: disputes.length,
      pending: disputes.filter((d) => d.status === 'pending').length,
      under_review: disputes.filter((d) => d.status === 'under_review').length,
      resolved: disputes.filter((d) => ['approved', 'denied', 'withdrawn'].includes(d.status)).length,
    };

    return NextResponse.json({ disputes, stats });
  } catch (error) {
    console.error('Disputes GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await getCurrentAgent();
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = createDisputeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const disputeData = parseResult.data;
    const supabase = await createClient();

    // Create dispute
    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({
        agent_id: agent.id,
        dispute_type: disputeData.dispute_type,
        subject: disputeData.subject,
        description: disputeData.description,
        commission_id: disputeData.commission_id || null,
        clawback_id: disputeData.clawback_id || null,
        bonus_id: disputeData.bonus_id || null,
        amount_disputed: disputeData.amount_disputed || null,
        attachments: disputeData.attachments || [],
        status: 'pending',
        priority: 'normal',
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Dispute create error:', error);
      return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
    }

    // Add history entry
    await supabase.from('dispute_history').insert({
      dispute_id: dispute.id,
      action: 'created',
      new_value: 'pending',
      agent_id: agent.id,
    } as never);

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (error) {
    console.error('Disputes POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
