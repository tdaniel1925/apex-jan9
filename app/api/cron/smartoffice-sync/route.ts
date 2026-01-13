/**
 * SmartOffice Cron Sync Endpoint
 * POST - Triggered by external scheduler (e.g., Vercel Cron)
 *
 * Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSmartOfficeSyncService } from '@/lib/smartoffice';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if SmartOffice is configured and active
    const supabase = createUntypedAdminClient();
    const { data: config } = await supabase
      .from('smartoffice_sync_config')
      .select('is_active')
      .single();

    if (!config?.is_active) {
      return NextResponse.json({
        success: false,
        message: 'SmartOffice sync is not active',
      });
    }

    // Run incremental sync (full sync for now, incremental TBD)
    const syncService = getSmartOfficeSyncService();
    const result = await syncService.fullSync('cron');

    return NextResponse.json({
      success: true,
      result: {
        agents: {
          synced: result.agents.synced,
          created: result.agents.created,
          updated: result.agents.updated,
          errors: result.agents.errors.length,
        },
        policies: {
          synced: result.policies.synced,
          created: result.policies.created,
          errors: result.policies.errors.length,
        },
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    console.error('SmartOffice cron sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier manual testing (still requires auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
