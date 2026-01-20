/**
 * System Status Endpoint
 * Phase 2 - Issue #30: Detailed system status for monitoring dashboards
 * GET /api/status
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import os from 'os';

export const dynamic = 'force-dynamic';

interface SystemStatus {
  system: {
    status: 'operational' | 'degraded' | 'down';
    environment: string;
    version: string;
    uptime: number;
    timestamp: string;
  };
  services: {
    database: ServiceStatus;
    api: ServiceStatus;
    storage: ServiceStatus;
  };
  metrics?: {
    cpu: {
      usage: number;
      cores: number;
    };
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
  };
}

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  lastChecked: string;
  error?: string;
  metrics?: Record<string, any>;
}

const startTime = Date.now();

export async function GET() {
  const status: SystemStatus = {
    system: {
      status: 'operational',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    },
    services: {
      database: await checkDatabase(),
      api: checkAPI(),
      storage: { status: 'operational', lastChecked: new Date().toISOString() },
    },
    metrics: getSystemMetrics(),
  };

  // Determine overall status
  const serviceStatuses = Object.values(status.services).map(s => s.status);
  if (serviceStatuses.includes('down')) {
    status.system.status = 'down';
  } else if (serviceStatuses.includes('degraded')) {
    status.system.status = 'degraded';
  }

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

async function checkDatabase(): Promise<ServiceStatus> {
  try {
    const supabase = createAdminClient();
    const start = Date.now();

    // Run multiple health checks
    const [agentsCheck, walletsCheck] = await Promise.all([
      supabase.from('agents').select('id', { count: 'exact', head: true }),
      supabase.from('wallets').select('id', { count: 'exact', head: true }),
    ]);

    const responseTime = Date.now() - start;

    if (agentsCheck.error || walletsCheck.error) {
      return {
        status: 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: agentsCheck.error?.message || walletsCheck.error?.message,
      };
    }

    return {
      status: 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      metrics: {
        agents: agentsCheck.count || 0,
        wallets: walletsCheck.count || 0,
      },
    };
  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkAPI(): ServiceStatus {
  return {
    status: 'operational',
    lastChecked: new Date().toISOString(),
    metrics: {
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
    },
  };
}

function getSystemMetrics() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpu: {
        usage: Math.round(os.loadavg()[0] * 100) / 100,
        cores: os.cpus().length,
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024), // MB
        free: Math.round(freeMem / 1024 / 1024),
        used: Math.round(usedMem / 1024 / 1024),
        usagePercent: Math.round((usedMem / totalMem) * 100),
      },
    };
  } catch {
    return undefined;
  }
}
