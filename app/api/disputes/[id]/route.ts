/**
 * Agent Dispute API
 * GET - Get dispute details with comments
 * POST - Add comment to dispute
 * DELETE - Withdraw dispute
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

interface Dispute {
  id: string;
  agent_id: string;
  dispute_type: string;
  subject: string;
  description: string;
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

interface DisputeComment {
  id: string;
  dispute_id: string;
  agent_id: string | null;
  admin_id: string | null;
  content: string;
  is_internal: boolean;
  attachments: unknown[];
  created_at: string;
}

interface DisputeHistory {
  id: string;
  dispute_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
  created_at: string;
}

const commentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(2000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get dispute
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: disputeData, error: disputeError } = await (supabase as any)
      .from('disputes')
      .select('*')
      .eq('id', id)
      .eq('agent_id', agent.id)
      .single() as { data: Dispute | null; error: unknown };

    if (disputeError || !disputeData) {
      return ApiErrors.notFound('Dispute');
    }

    // Get comments (non-internal only)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: commentsData } = await (supabase as any)
      .from('dispute_comments')
      .select('*')
      .eq('dispute_id', id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true }) as { data: DisputeComment[] | null };

    const comments = commentsData || [];

    // Get history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: historyData } = await (supabase as any)
      .from('dispute_history')
      .select('*')
      .eq('dispute_id', id)
      .order('created_at', { ascending: true }) as { data: DisputeHistory[] | null };

    const history = historyData || [];

    return apiSuccess({ dispute: disputeData, comments, history });
  } catch (error) {
    console.error('Dispute GET error:', error);
    return ApiErrors.internal();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const parseResult = commentSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    // Verify dispute belongs to agent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: disputeData, error: disputeError } = await (supabase as any)
      .from('disputes')
      .select('id, status')
      .eq('id', id)
      .eq('agent_id', agent.id)
      .single() as { data: { id: string; status: string } | null; error: unknown };

    if (disputeError || !disputeData) {
      return ApiErrors.notFound('Dispute');
    }

    // Can't comment on closed disputes
    if (['approved', 'denied', 'withdrawn'].includes(disputeData.status)) {
      return ApiErrors.validation({ _errors: ['Cannot comment on closed disputes'] });
    }

    // Add comment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comment, error: commentError } = await (supabase as any)
      .from('dispute_comments')
      .insert({
        dispute_id: id,
        agent_id: agent.id,
        content: parseResult.data.content,
        attachments: parseResult.data.attachments || [],
        is_internal: false,
      })
      .select()
      .single() as { data: DisputeComment | null; error: unknown };

    if (commentError || !comment) {
      console.error('Comment create error:', commentError);
      return ApiErrors.internal('Failed to add comment');
    }

    return apiSuccess({ comment }, 201);
  } catch (error) {
    console.error('Dispute POST error:', error);
    return ApiErrors.internal();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify dispute belongs to agent and is pending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: disputeData, error: disputeError } = await (supabase as any)
      .from('disputes')
      .select('id, status')
      .eq('id', id)
      .eq('agent_id', agent.id)
      .single() as { data: { id: string; status: string } | null; error: unknown };

    if (disputeError || !disputeData) {
      return ApiErrors.notFound('Dispute');
    }

    // Can only withdraw pending disputes
    if (disputeData.status !== 'pending') {
      return ApiErrors.validation({ _errors: ['Can only withdraw pending disputes'] });
    }

    // Update status to withdrawn
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('disputes')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Dispute withdraw error:', updateError);
      return ApiErrors.internal('Failed to withdraw dispute');
    }

    // Add history entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('dispute_history').insert({
      dispute_id: id,
      action: 'status_changed',
      old_value: 'pending',
      new_value: 'withdrawn',
      notes: 'Withdrawn by agent',
      agent_id: agent.id,
    });

    return apiSuccess({ success: true, message: 'Dispute withdrawn' });
  } catch (error) {
    console.error('Dispute DELETE error:', error);
    return ApiErrors.internal();
  }
}
