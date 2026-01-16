/**
 * Compliance Summary API
 *
 * GET - Retrieve compliance summary statistics
 *
 * Admin-only access required
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
      .single() as { data: { role: string } | null };

    if (!adminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query for summary
    let query = adminDb
      .from('compliance_logs')
      .select('event_type, original_amount');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching compliance summary:', error);
      return NextResponse.json({ error: 'Failed to fetch compliance summary' }, { status: 500 });
    }

    // Calculate summary statistics
    let totalEvents = 0;
    let overridesPrevented = 0;
    let commissionsRolledUp = 0;
    let commissionsForfeited = 0;
    let licenseChanges = 0;
    let amountRolledUp = 0;
    let amountForfeited = 0;

    for (const log of logs || []) {
      totalEvents++;
      const amount = log.original_amount || 0;

      switch (log.event_type) {
        case 'unlicensed_override_prevented':
          overridesPrevented++;
          break;
        case 'commission_rolled_up':
          commissionsRolledUp++;
          amountRolledUp += amount;
          break;
        case 'commission_forfeited':
          commissionsForfeited++;
          amountForfeited += amount;
          break;
        case 'license_status_change':
          licenseChanges++;
          break;
      }
    }

    // Get count of unlicensed agents
    const { count: unlicensedCount } = await adminDb
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .neq('license_status', 'licensed');

    // Get count of agents with expiring licenses (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const futureString = `${thirtyDaysFromNow.getFullYear()}-${String(thirtyDaysFromNow.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysFromNow.getDate()).padStart(2, '0')}`;

    const { count: expiringCount } = await adminDb
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('license_status', 'licensed')
      .lte('license_expiration_date', futureString)
      .gte('license_expiration_date', todayString);

    return NextResponse.json({
      summary: {
        totalEvents,
        overridesPrevented,
        commissionsRolledUp,
        commissionsForfeited,
        licenseChanges,
        amountRolledUp,
        amountForfeited,
        totalAmountAffected: amountRolledUp + amountForfeited,
      },
      agents: {
        unlicensedCount: unlicensedCount || 0,
        expiringLicensesCount: expiringCount || 0,
      },
    });
  } catch (error) {
    console.error('Compliance summary GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
