/**
 * Agent Dispute API
 * GET - Get dispute details with comments
 * POST - Add comment to dispute
 * DELETE - Withdraw dispute
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/db/supabase-server';
import { getCurrentAgent } from '@/lib/auth/session';

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
    const agent = await getCurrentAgent();
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get dispute
    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', id)
      .eq('agent_id', agent.id)
      .single();

    if (disputeError || !disputeData) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const dispute = disputeData as unknown as Dispute;

    // Get comments (non-internal only)
    const { data: commentsData } = await supabase
      .from('dispute_comments')
      .select('*')
      .eq('dispute_id', id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    const comments = (commentsData || []) as unknown as DisputeComment[];

    // Get history
    const { data: historyData } = await supabase
      .from('dispute_history')
      .select('*')
      .eq('dispute_id', id)
      .order('created_at', { ascending: true });

    const history = (historyData || []) as unknown as DisputeHistory[];

    return NextResponse.json({ dispute, comments, history });
  } catch (error) {
    console.error('Dispute GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getCurrentAgent();
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parseResult = commentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify dispute belongs to agent
    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .select('id, status')
      .eq('id', id)
      .eq('agent_id', agent.id)
      .single();

    if (disputeError || !disputeData) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const dispute = disputeData as unknown as { id: string; status: string };

    // Can't comment on closed disputes
    if (['approved', 'denied', 'withdrawn'].includes(dispute.status)) {
      return NextResponse.json({ error: 'Cannot comment on closed disputes' }, { status: 400 });
    }

    // Add comment
    const { data: comment, error: commentError } = await supabase
      .from('dispute_comments')
      .insert({
        dispute_id: id,
        agent_id: agent.id,
        content: parseResult.data.content,
        attachments: parseResult.data.attachments || [],
        is_internal: false,
      } as never)
      .select()
      .single();

    if (commentError) {
      console.error('Comment create error:', commentError);
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Dispute POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getCurrentAgent();
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Verify dispute belongs to agent and is pending
    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .select('id, status')
      .eq('id', id)
      .eq('agent_id', agent.id)
      .single();

    if (disputeError || !disputeData) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const dispute = disputeData as unknown as { id: string; status: string };

    // Can only withdraw pending disputes
    if (dispute.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only withdraw pending disputes' },
        { status: 400 }
      );
    }

    // Update status to withdrawn
    const { error: updateError } = await supabase
      .from('disputes')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id);

    if (updateError) {
      console.error('Dispute withdraw error:', updateError);
      return NextResponse.json({ error: 'Failed to withdraw dispute' }, { status: 500 });
    }

    // Add history entry
    await supabase.from('dispute_history').insert({
      dispute_id: id,
      action: 'status_changed',
      old_value: 'pending',
      new_value: 'withdrawn',
      notes: 'Withdrawn by agent',
      agent_id: agent.id,
    } as never);

    return NextResponse.json({ success: true, message: 'Dispute withdrawn' });
  } catch (error) {
    console.error('Dispute DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
