/**
 * Admin API for managing Founder Partners
 * GET - List all 4 founder partner slots
 * PUT - Update a founder partner slot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { z } from 'zod';

// Schema for updating a founder partner
const updatePartnerSchema = z.object({
  slot_number: z.number().min(1).max(4),
  name: z.string().min(1).max(255).nullable(),
  email: z.string().email().nullable(),
  agent_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
});

interface FounderPartner {
  id: string;
  slot_number: number;
  name: string | null;
  email: string | null;
  agent_id: string | null;
  user_id: string | null;
  share_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OverrideTotalRow {
  period_year: number;
  period_month: number;
  status: string;
  override_count: number;
  total_amount: number;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all founder partner slots with agent info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partners, error } = await (supabase as any)
      .from('founder_partners')
      .select(`
        *,
        agent:agents(
          id,
          first_name,
          last_name,
          email,
          agent_code,
          rank
        )
      `)
      .order('slot_number') as { data: FounderPartner[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching founder partners:', error);
      return NextResponse.json(
        { error: 'Failed to fetch founder partners' },
        { status: 500 }
      );
    }

    // Get FC Inc. override totals for display
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: overrideTotals, error: totalsError } = await (supabase as any)
      .from('founder_override_totals')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(12) as { data: OverrideTotalRow[] | null; error: Error | null };

    if (totalsError) {
      console.error('Error fetching override totals:', totalsError);
    }

    // Calculate total pending and paid overrides
    let totalPending = 0;
    let totalPaid = 0;

    if (overrideTotals) {
      overrideTotals.forEach((row: OverrideTotalRow) => {
        if (row.status === 'pending') {
          totalPending += Number(row.total_amount) || 0;
        } else if (row.status === 'paid') {
          totalPaid += Number(row.total_amount) || 0;
        }
      });
    }

    return NextResponse.json({
      partners: partners || [],
      overrideSummary: {
        totalPending,
        totalPaid,
        recentPeriods: overrideTotals || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/founders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate request body
    const validation = updatePartnerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { slot_number, name, email, agent_id, is_active } = validation.data;

    // If agent_id is provided, verify the agent exists
    if (agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, user_id')
        .eq('id', agent_id)
        .single();

      if (agentError || !agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }

      const agentUserId = (agent as { id: string; user_id: string | null }).user_id;

      // Update with agent info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error: updateError } = await (supabase as any)
        .from('founder_partners')
        .update({
          name,
          email,
          agent_id,
          user_id: agentUserId,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('slot_number', slot_number)
        .select()
        .single() as { data: FounderPartner | null; error: Error | null };

      if (updateError) {
        console.error('Error updating founder partner:', updateError);
        return NextResponse.json(
          { error: 'Failed to update founder partner' },
          { status: 500 }
        );
      }

      return NextResponse.json({ partner: updated });
    }

    // Update without agent (clearing or partial update)
    const isActiveValue = is_active && !!name && !!email;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .from('founder_partners')
      .update({
        name,
        email,
        agent_id: null,
        user_id: null,
        is_active: isActiveValue,
        updated_at: new Date().toISOString(),
      })
      .eq('slot_number', slot_number)
      .select()
      .single() as { data: FounderPartner | null; error: Error | null };

    if (updateError) {
      console.error('Error updating founder partner:', updateError);
      return NextResponse.json(
        { error: 'Failed to update founder partner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ partner: updated });
  } catch (error) {
    console.error('Error in PUT /api/admin/founders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
