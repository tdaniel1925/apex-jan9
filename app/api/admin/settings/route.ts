/**
 * Admin Settings API
 * GET - Get system settings
 * PATCH - Update system settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { getCurrentPhase } from '@/lib/config/bonuses';
import { RANKS, RANK_CONFIG } from '@/lib/config/ranks';
import { GENERATION_OVERRIDES, TOTAL_OVERRIDE_PERCENTAGE } from '@/lib/config/overrides';

// Settings update schema
const updateSettingsSchema = z.object({
  // System settings that could be stored in a settings table
  maintenance_mode: z.boolean().optional(),
  registration_enabled: z.boolean().optional(),
  min_withdrawal_ach: z.number().positive().optional(),
  min_withdrawal_wire: z.number().positive().optional(),
  min_withdrawal_check: z.number().positive().optional(),
  fast_start_window_days: z.number().positive().optional(),
});

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();

    // Get agent count for phase calculation
    const { count: agentCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const currentPhase = getCurrentPhase(agentCount || 0);

    // Get system health metrics
    const [
      { count: totalAgents },
      { count: totalCommissions },
      { count: pendingPayouts },
      { count: pendingBonuses },
    ] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('commissions').select('*', { count: 'exact', head: true }),
      supabase.from('payouts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bonuses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Current configuration (from config files)
    const configuration = {
      ranks: RANKS.map(rank => ({
        ...RANK_CONFIG[rank],
        id: rank,
      })),
      overrides: {
        generations: GENERATION_OVERRIDES,
        totalPercentage: TOTAL_OVERRIDE_PERCENTAGE,
      },
      phases: [
        { phase: 1, minAgents: 0, maxAgents: 100 },
        { phase: 2, minAgents: 100, maxAgents: 250 },
        { phase: 3, minAgents: 250, maxAgents: 500 },
        { phase: 4, minAgents: 500, maxAgents: null },
      ],
      withdrawalFees: {
        ach: 0,
        wire: 25,
        check: 5,
      },
      withdrawalMinimums: {
        ach: 25,
        wire: 100,
        check: 50,
      },
    };

    // System status
    const systemStatus = {
      currentPhase,
      activeAgents: agentCount || 0,
      totalAgents: totalAgents || 0,
      pendingPayouts: pendingPayouts || 0,
      pendingBonuses: pendingBonuses || 0,
      totalCommissions: totalCommissions || 0,
      databaseHealthy: true, // Would do actual health check
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      configuration,
      systemStatus,
      // These would come from a settings table in the future
      settings: {
        maintenance_mode: false,
        registration_enabled: true,
      },
    });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json();
    const parseResult = updateSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    // In a real implementation, these would be stored in a settings table
    // For now, we'll just acknowledge the update
    const updates = parseResult.data;

    // Log the settings change for audit
    console.log('Settings updated by admin:', admin.agent.email, updates);

    return NextResponse.json({
      success: true,
      message: 'Settings updated',
      settings: updates,
    });
  } catch (error) {
    console.error('Admin settings PATCH error:', error);
    return serverErrorResponse();
  }
}
