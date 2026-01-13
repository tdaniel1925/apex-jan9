/**
 * Agent Disputes API
 * GET - List agent's disputes
 * POST - Create a new dispute
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

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
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!agent) {
      return ApiErrors.notFound('Agent');
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('disputes')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query as { data: Dispute[] | null; error: unknown };

    if (error) {
      console.error('Disputes fetch error:', error);
      return ApiErrors.internal('Failed to fetch disputes');
    }

    const disputes = data || [];

    // Get stats
    const stats = {
      total: disputes.length,
      pending: disputes.filter((d) => d.status === 'pending').length,
      under_review: disputes.filter((d) => d.status === 'under_review').length,
      resolved: disputes.filter((d) => ['approved', 'denied', 'withdrawn'].includes(d.status)).length,
    };

    return apiSuccess({ disputes, stats });
  } catch (error) {
    console.error('Disputes GET error:', error);
    return ApiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!agent) {
      return ApiErrors.notFound('Agent');
    }

    const body = await request.json();
    const parseResult = createDisputeSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const disputeData = parseResult.data;

    // Create dispute
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dispute, error } = await (supabase as any)
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
      })
      .select()
      .single() as { data: Dispute | null; error: unknown };

    if (error || !dispute) {
      console.error('Dispute create error:', error);
      return ApiErrors.internal('Failed to create dispute');
    }

    // Add history entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('dispute_history').insert({
      dispute_id: dispute.id,
      action: 'created',
      new_value: 'pending',
      agent_id: agent.id,
    });

    return apiSuccess({ dispute }, 201);
  } catch (error) {
    console.error('Disputes POST error:', error);
    return ApiErrors.internal();
  }
}
