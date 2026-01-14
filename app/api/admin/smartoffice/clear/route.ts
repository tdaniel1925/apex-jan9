/**
 * SmartOffice Clear Data API
 * DELETE - Clear all SmartOffice synced data (for testing/reset purposes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const supabase = createUntypedAdminClient();

    // Get confirmation from request body
    const body = await request.json().catch(() => ({}));
    const { confirm } = body;

    if (confirm !== 'DELETE_ALL_SMARTOFFICE_DATA') {
      return NextResponse.json(
        { error: 'Confirmation required. Send { confirm: "DELETE_ALL_SMARTOFFICE_DATA" }' },
        { status: 400 }
      );
    }

    // Get counts before deleting
    const { count: logsCount } = await supabase
      .from('smartoffice_sync_logs')
      .select('*', { count: 'exact', head: true });

    const { count: policiesCount } = await supabase
      .from('smartoffice_policies')
      .select('*', { count: 'exact', head: true });

    const { count: agentsCount } = await supabase
      .from('smartoffice_agents')
      .select('*', { count: 'exact', head: true });

    // Delete in correct order to respect foreign key constraints
    // 1. Delete sync logs first (they reference nothing critical)
    const { error: logsError } = await supabase
      .from('smartoffice_sync_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (logsError) {
      console.error('Error deleting sync logs:', logsError);
    }

    // 2. Delete policies (they may reference agents)
    const { error: policiesError } = await supabase
      .from('smartoffice_policies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (policiesError) {
      console.error('Error deleting policies:', policiesError);
    }

    // 3. Delete agents last
    const { error: agentsError } = await supabase
      .from('smartoffice_agents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (agentsError) {
      console.error('Error deleting agents:', agentsError);
    }

    const logsDeleted = logsCount || 0;
    const policiesDeleted = policiesCount || 0;
    const agentsDeleted = agentsCount || 0;

    // Note: We preserve the smartoffice_config table - only clearing synced data

    return NextResponse.json({
      success: true,
      message: 'All SmartOffice data cleared successfully',
      deleted: {
        agents: agentsDeleted || 0,
        policies: policiesDeleted || 0,
        syncLogs: logsDeleted || 0,
      },
    });
  } catch (error) {
    console.error('Error clearing SmartOffice data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear data' },
      { status: 500 }
    );
  }
}
