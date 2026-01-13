/**
 * SmartOffice Sync API
 * POST - Trigger a manual sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { getSmartOfficeSyncService } from '@/lib/smartoffice';

const syncSchema = z.object({
  type: z.enum(['full', 'agents', 'policies', 'automap']).default('full'),
});

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = syncSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Invalid sync type', parseResult.error.flatten());
    }

    const { type } = parseResult.data;
    const syncService = getSmartOfficeSyncService();

    let result;

    switch (type) {
      case 'full':
        result = await syncService.fullSync('manual', admin.userId);
        break;
      case 'agents':
        result = { agents: await syncService.syncAgents() };
        break;
      case 'policies':
        result = { policies: await syncService.syncPolicies() };
        break;
      case 'automap':
        result = await syncService.autoMapAgentsByEmail();
        break;
      default:
        return badRequestResponse('Invalid sync type');
    }

    return NextResponse.json({
      success: true,
      type,
      result,
    });
  } catch (error) {
    console.error('SmartOffice sync error:', error);
    return serverErrorResponse(error instanceof Error ? error.message : 'Sync failed');
  }
}
