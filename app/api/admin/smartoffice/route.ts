/**
 * SmartOffice Admin API
 * GET - Get SmartOffice config and status
 * POST - Save/update SmartOffice config
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { testSmartOfficeCredentials, resetSmartOfficeClient } from '@/lib/smartoffice';
import { getSmartOfficeSyncService } from '@/lib/smartoffice';

// Config schema
const configSchema = z.object({
  api_url: z.string().url().optional(),
  sitename: z.string().min(1, 'Sitename is required'),
  username: z.string().min(1, 'Username is required'),
  api_key: z.string().min(1, 'API key is required'),
  api_secret: z.string().min(1, 'API secret is required'),
  is_active: z.boolean().optional(),
  sync_frequency_hours: z.number().min(1).max(168).optional(),
  webhook_enabled: z.boolean().optional(),
  webhook_secret: z.string().optional().nullable(),
});

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createUntypedAdminClient();

    // Get config (mask secrets)
    const { data: config } = await supabase
      .from('smartoffice_sync_config')
      .select('*')
      .limit(1)
      .single();

    // Get sync stats
    const syncService = getSmartOfficeSyncService();
    const stats = await syncService.getSyncStats();

    // Get recent logs
    const logs = await syncService.getSyncLogs(5);

    // Mask sensitive fields
    const maskedConfig = config
      ? {
          ...config,
          api_key: config.api_key ? '••••' + config.api_key.slice(-4) : null,
          api_secret: config.api_secret ? '••••' + config.api_secret.slice(-4) : null,
          webhook_secret: config.webhook_secret ? '••••••••' : null,
        }
      : null;

    return NextResponse.json({
      config: maskedConfig,
      stats,
      recentLogs: logs,
      isConfigured: !!config,
    });
  } catch (error) {
    console.error('SmartOffice GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json();
    const parseResult = configSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const data = parseResult.data;

    // Test credentials before saving
    const testResult = await testSmartOfficeCredentials({
      apiUrl: data.api_url || 'https://api.sandbox.smartofficecrm.com/3markapex/v1/send',
      sitename: data.sitename,
      username: data.username,
      apiKey: data.api_key,
      apiSecret: data.api_secret,
    });

    if (!testResult.success) {
      return badRequestResponse('SmartOffice connection failed', { message: testResult.message });
    }

    // Save to database
    const supabase = createUntypedAdminClient();

    // Check if config exists
    const { data: existing } = await supabase
      .from('smartoffice_sync_config')
      .select('id')
      .limit(1)
      .single();

    const configData = {
      api_url: data.api_url || 'https://api.sandbox.smartofficecrm.com/3markapex/v1/send',
      sitename: data.sitename,
      username: data.username,
      api_key: data.api_key,
      api_secret: data.api_secret,
      is_active: data.is_active ?? true,
      sync_frequency_hours: data.sync_frequency_hours ?? 6,
      webhook_enabled: data.webhook_enabled ?? false,
      webhook_secret: data.webhook_secret ?? null,
      next_sync_at: new Date(Date.now() + (data.sync_frequency_hours || 6) * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from('smartoffice_sync_config').update(configData).eq('id', existing.id);
    } else {
      await supabase.from('smartoffice_sync_config').insert(configData);
    }

    // Reset the client so it picks up new credentials
    resetSmartOfficeClient();

    return NextResponse.json({
      success: true,
      message: testResult.message,
    });
  } catch (error) {
    console.error('SmartOffice POST error:', error);
    return serverErrorResponse();
  }
}
