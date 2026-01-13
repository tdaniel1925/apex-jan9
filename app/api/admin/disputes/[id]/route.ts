/**
 * Admin Dispute API
 * GET - Get dispute details with all comments
 * PUT - Update dispute status/resolution
 * POST - Add admin comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, notFoundResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

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
  agents: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    agent_code: string;
  };
}

const VALID_STATUSES = ['pending', 'under_review', 'info_requested', 'approved', 'denied', 'withdrawn'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const updateDisputeSchema = z.object({
  status: z.enum(['pending', 'under_review', 'info_requested', 'approved', 'denied']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  resolution: z.string().optional(),
  amount_adjusted: z.number().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(2000),
  is_internal: z.boolean().optional(),
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
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get dispute with agent info
    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .select(`
        *,
        agents (
          id,
          first_name,
          last_name,
          email,
          agent_code,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (disputeError || !disputeData) {
      return notFoundResponse('Dispute not found');
    }

    const dispute = disputeData as unknown as Dispute;

    // Get all comments (including internal)
    const { data: commentsData } = await supabase
      .from('dispute_comments')
      .select(`
        *,
        agents (first_name, last_name),
        admin_users:admin_id (first_name, last_name)
      `)
      .eq('dispute_id', id)
      .order('created_at', { ascending: true });

    // Get history
    const { data: historyData } = await supabase
      .from('dispute_history')
      .select(`
        *,
        agents (first_name, last_name),
        admin_users:admin_id (first_name, last_name)
      `)
      .eq('dispute_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      dispute,
      comments: commentsData || [],
      history: historyData || [],
    });
  } catch (error) {
    console.error('Dispute GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const parseResult = updateDisputeSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const supabase = createAdminClient();
    const updateData = parseResult.data;

    // Get current dispute
    const { data: currentData, error: currentError } = await supabase
      .from('disputes')
      .select('id, status, priority')
      .eq('id', id)
      .single();

    if (currentError || !currentData) {
      return notFoundResponse('Dispute not found');
    }

    const current = currentData as unknown as { id: string; status: string; priority: string };

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.status) {
      updates.status = updateData.status;
      if (['approved', 'denied'].includes(updateData.status)) {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = admin.agentId;
      }
    }

    if (updateData.priority) {
      updates.priority = updateData.priority;
    }

    if (updateData.resolution !== undefined) {
      updates.resolution = updateData.resolution;
    }

    if (updateData.amount_adjusted !== undefined) {
      updates.amount_adjusted = updateData.amount_adjusted;
    }

    // Update dispute
    const { data: dispute, error: updateError } = await supabase
      .from('disputes')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Dispute update error:', updateError);
      return serverErrorResponse();
    }

    // Add history entries for status change
    if (updateData.status && updateData.status !== current.status) {
      await supabase.from('dispute_history').insert({
        dispute_id: id,
        action: 'status_changed',
        old_value: current.status,
        new_value: updateData.status,
        admin_id: admin.agentId,
      } as never);
    }

    // Add history entries for priority change
    if (updateData.priority && updateData.priority !== current.priority) {
      await supabase.from('dispute_history').insert({
        dispute_id: id,
        action: 'priority_changed',
        old_value: current.priority,
        new_value: updateData.priority,
        admin_id: admin.agentId,
      } as never);
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    console.error('Dispute PUT error:', error);
    return serverErrorResponse();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const parseResult = commentSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const supabase = createAdminClient();

    // Verify dispute exists
    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .select('id')
      .eq('id', id)
      .single();

    if (disputeError || !disputeData) {
      return notFoundResponse('Dispute not found');
    }

    // Add comment
    const { data: comment, error: commentError } = await supabase
      .from('dispute_comments')
      .insert({
        dispute_id: id,
        admin_id: admin.agentId,
        content: parseResult.data.content,
        is_internal: parseResult.data.is_internal || false,
        attachments: parseResult.data.attachments || [],
      } as never)
      .select()
      .single();

    if (commentError) {
      console.error('Comment create error:', commentError);
      return serverErrorResponse();
    }

    // Add history entry
    await supabase.from('dispute_history').insert({
      dispute_id: id,
      action: parseResult.data.is_internal ? 'internal_note_added' : 'comment_added',
      admin_id: admin.agentId,
    } as never);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Dispute POST error:', error);
    return serverErrorResponse();
  }
}
