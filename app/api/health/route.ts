/**
 * Health Check Endpoint
 * Phase 2 - Issue #30: Service health monitoring
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    api: {
      status: 'up' | 'down';
    };
    external?: {
      stripe?: 'up' | 'down';
      anthropic?: 'up' | 'down';
    };
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET() {
  const checkStartTime = Date.now();
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      database: { status: 'down' },
      api: { status: 'up' },
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Check database connectivity
  try {
    const supabase = createAdminClient();
    const dbCheckStart = Date.now();

    const { error } = await supabase
      .from('agents')
      .select('id')
      .limit(1)
      .single();

    const dbResponseTime = Date.now() - dbCheckStart;

    if (!error || error.code === 'PGRST116') {
      // PGRST116 = no rows, but connection works
      healthCheck.checks.database = {
        status: 'up',
        responseTime: dbResponseTime,
      };
    } else {
      healthCheck.checks.database = {
        status: 'down',
        error: error.message,
      };
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    healthCheck.status = 'unhealthy';
  }

  // Return appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

  return NextResponse.json(healthCheck, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
