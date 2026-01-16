/**
 * Compliance Logs API
 *
 * GET - Retrieve compliance logs with filtering and pagination
 *
 * Admin-only access required
 * Logs are IMMUTABLE - no POST/PUT/DELETE endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createUntypedAdminClient } from '@/lib/db/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminDb = createUntypedAdminClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent record
    const { data: agent } = await adminDb
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null };

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check admin role
    const { data: adminRole } = await adminDb
      .from('admin_roles')
      .select('role')
      .eq('agent_id', agent.id)
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('event_type');
    const agentId = searchParams.get('agent_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // Build query
    let query = adminDb
      .from('compliance_logs')
      .select(`
        *,
        agent:agents!compliance_logs_agent_id_fkey(id, first_name, last_name, email),
        rolled_up_to_agent:agents!compliance_logs_rolled_up_to_agent_id_fkey(id, first_name, last_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching compliance logs:', error);
      return NextResponse.json({ error: 'Failed to fetch compliance logs' }, { status: 500 });
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Compliance logs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
