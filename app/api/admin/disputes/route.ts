/**
 * Admin Disputes API
 * GET - List all disputes with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

interface Dispute {
  id: string;
  agent_id: string;
  dispute_type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
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

const querySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  agent_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { status, type, priority, agent_id, search } = parseResult.data;

    let query = supabase
      .from('disputes')
      .select(`
        *,
        agents (
          id,
          first_name,
          last_name,
          email,
          agent_code
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (type && type !== 'all') {
      query = query.eq('dispute_type', type);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Disputes fetch error:', error);
      return serverErrorResponse();
    }

    const disputes = (data || []) as unknown as Dispute[];

    // Get stats
    const { data: allDisputes } = await supabase
      .from('disputes')
      .select('status, priority');

    const allDisputesTyped = (allDisputes || []) as unknown as { status: string; priority: string }[];
    const stats = {
      total: allDisputesTyped.length,
      pending: allDisputesTyped.filter((d) => d.status === 'pending').length,
      under_review: allDisputesTyped.filter((d) => d.status === 'under_review').length,
      info_requested: allDisputesTyped.filter((d) => d.status === 'info_requested').length,
      approved: allDisputesTyped.filter((d) => d.status === 'approved').length,
      denied: allDisputesTyped.filter((d) => d.status === 'denied').length,
      urgent: allDisputesTyped.filter((d) => d.priority === 'urgent').length,
    };

    return NextResponse.json({ disputes, stats });
  } catch (error) {
    console.error('Disputes GET error:', error);
    return serverErrorResponse();
  }
}
