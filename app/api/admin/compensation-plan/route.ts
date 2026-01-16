/**
 * Compensation Plan Settings API
 *
 * GET - Retrieve active compensation plan configuration
 * PUT - Update compensation plan settings
 *
 * Admin-only access required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createUntypedAdminClient } from '@/lib/db/supabase-server';
import { z } from 'zod';

// Validation schema for updating compensation plan
const updatePlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  unlicensed_override_handling: z.enum(['roll_up_to_next_licensed', 'company_retains']).optional(),
  max_generation_levels: z.number().int().min(1).max(10).optional(),
  max_rollup_generations: z.number().int().min(1).max(10).optional(),
  chargeback_period_months: z.number().int().min(1).max(36).optional(),
  minimum_payout_threshold: z.number().min(0).max(1000).optional(),
  payment_frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const adminDb = createUntypedAdminClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent record (use untyped for consistent behavior)
    const { data: agent } = await adminDb
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null };

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check admin role using agent id
    const { data: agentAdminRole } = await adminDb
      .from('admin_roles')
      .select('role')
      .eq('agent_id', agent.id)
      .single();

    if (!agentAdminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get active compensation plan
    const { data: plan, error } = await adminDb
      .from('compensation_plan_configs')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      // If no plan exists, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          id: null,
          name: 'Default Plan',
          description: 'No active plan configured',
          unlicensed_override_handling: 'roll_up_to_next_licensed',
          max_generation_levels: 6,
          max_rollup_generations: 7,
          chargeback_period_months: 12,
          minimum_payout_threshold: 25,
          payment_frequency: 'monthly',
          is_active: false,
        });
      }
      console.error('Error fetching compensation plan:', error);
      return NextResponse.json({ error: 'Failed to fetch compensation plan' }, { status: 500 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Compensation plan GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePlanSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Get active plan ID
    const { data: existingPlan, error: fetchError } = await adminDb
      .from('compensation_plan_configs')
      .select('id')
      .eq('is_active', true)
      .single() as { data: { id: string } | null; error: unknown };

    if (fetchError || !existingPlan) {
      // Create new plan if none exists
      const { data: newPlan, error: createError } = await adminDb
        .from('compensation_plan_configs')
        .insert({
          name: updates.name || 'Apex Standard Plan',
          description: updates.description || null,
          unlicensed_override_handling: updates.unlicensed_override_handling || 'roll_up_to_next_licensed',
          max_generation_levels: updates.max_generation_levels || 6,
          max_rollup_generations: updates.max_rollup_generations || 7,
          chargeback_period_months: updates.chargeback_period_months || 12,
          minimum_payout_threshold: updates.minimum_payout_threshold || 25,
          payment_frequency: updates.payment_frequency || 'monthly',
          is_active: true,
          created_by: agent.id,
          updated_by: agent.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating compensation plan:', createError);
        return NextResponse.json({ error: 'Failed to create compensation plan' }, { status: 500 });
      }

      return NextResponse.json(newPlan);
    }

    // Update existing plan
    const { data: updatedPlan, error: updateError } = await adminDb
      .from('compensation_plan_configs')
      .update({
        ...updates,
        updated_by: agent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPlan.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating compensation plan:', updateError);
      return NextResponse.json({ error: 'Failed to update compensation plan' }, { status: 500 });
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Compensation plan PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
