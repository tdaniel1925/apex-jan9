/**
 * Simple Ping Endpoint
 * Phase 2 - Issue #30: Ultra-fast health check for uptime monitoring
 * GET /api/ping
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
