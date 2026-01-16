/**
 * Comp Plan Settings API
 * GET - Get incentive program settings
 * PUT - Update incentive program settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import {
  INCENTIVE_PROGRAMS,
  CAR_BONUS_TIERS,
  FAST_START_MILESTONES,
  ELITE_10_CONFIG,
} from '@/lib/config/incentives';

// Schema for updating program settings
const updateProgramSchema = z.object({
  programs: z.array(z.object({
    program_key: z.string(),
    is_enabled: z.boolean(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })),
});

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();

    // Fetch program settings from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: programs, error } = await (supabase as any)
      .from('incentive_program_settings')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Error fetching incentive program settings:', error);

      // Return defaults if table doesn't exist yet
      return NextResponse.json({
        programs: [
          {
            id: '1',
            program_key: INCENTIVE_PROGRAMS.CAR_BONUS,
            program_name: 'APEX Drive (Car Bonus)',
            is_enabled: true,
            settings: {},
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            program_key: INCENTIVE_PROGRAMS.FAST_START,
            program_name: 'APEX Ignition (Fast Start)',
            is_enabled: true,
            settings: {},
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            program_key: INCENTIVE_PROGRAMS.ELITE_10,
            program_name: 'Elite 10 Recognition',
            is_enabled: true,
            settings: {},
            updated_at: new Date().toISOString(),
          },
        ],
        configuration: {
          carBonusTiers: CAR_BONUS_TIERS,
          fastStartMilestones: FAST_START_MILESTONES,
          elite10Config: ELITE_10_CONFIG,
        },
      });
    }

    // Get additional stats for each program
    // Wrap each query in a try-catch to handle missing tables gracefully
    let carBonusEligible = 0;
    let fastStartActive = 0;
    let elite10Current = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const carBonusResult = await (supabase as any)
        .from('incentive_car_bonus_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('payout_status', 'pending');
      carBonusEligible = carBonusResult.count || 0;
    } catch {
      // Table may not exist yet
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fastStartResult = await (supabase as any)
        .from('incentive_fast_start_tracking')
        .select('*', { count: 'exact', head: true })
        .is('achieved_date', null);
      fastStartActive = fastStartResult.count || 0;
    } catch {
      // Table may not exist yet
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elite10Result = await (supabase as any)
        .from('incentive_elite_10_members')
        .select('*', { count: 'exact', head: true });
      elite10Current = elite10Result.count || 0;
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({
      programs: programs || [],
      stats: {
        carBonusEligible: carBonusEligible || 0,
        fastStartActive: fastStartActive || 0,
        elite10Current: elite10Current || 0,
      },
      configuration: {
        carBonusTiers: CAR_BONUS_TIERS,
        fastStartMilestones: FAST_START_MILESTONES,
        elite10Config: ELITE_10_CONFIG,
      },
    });
  } catch (error) {
    console.error('Comp plan settings GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json();
    const parseResult = updateProgramSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { programs } = parseResult.data;
    const supabase = createAdminClient();
    const updates: { program_key: string; is_enabled: boolean }[] = [];

    for (const program of programs) {
      // Fast Start cannot be disabled
      if (program.program_key === INCENTIVE_PROGRAMS.FAST_START && !program.is_enabled) {
        continue; // Skip, keep enabled
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('incentive_program_settings')
        .update({
          is_enabled: program.is_enabled,
          settings: program.settings || {},
          updated_by: admin.agent.id,
          updated_at: new Date().toISOString(),
        })
        .eq('program_key', program.program_key);

      if (error) {
        console.error(`Error updating ${program.program_key}:`, error);
        continue;
      }

      updates.push({
        program_key: program.program_key,
        is_enabled: program.is_enabled,
      });
    }

    // Log the change for audit
    console.log('Comp plan settings updated by admin:', admin.agent.email, updates);

    return NextResponse.json({
      success: true,
      message: 'Comp plan settings updated',
      updates,
    });
  } catch (error) {
    console.error('Comp plan settings PUT error:', error);
    return serverErrorResponse();
  }
}
