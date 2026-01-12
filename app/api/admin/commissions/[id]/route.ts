/**
 * Admin Single Commission API
 * GET - Get commission details
 * PATCH - Update commission
 * DELETE - Delete commission
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Commission } from '@/lib/types/database';

// Update schema
const updateCommissionSchema = z.object({
  carrier: z.string().optional(),
  policy_number: z.string().min(1).optional(),
  premium_amount: z.number().positive().optional(),
  commission_rate: z.number().min(0).max(1).optional(),
  commission_amount: z.number().positive().optional(),
  policy_date: z.string().optional(),
  status: z.enum(['pending', 'paid', 'reversed']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('commissions')
      .select('*, agents(id, first_name, last_name, email, agent_code, rank)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return notFoundResponse('Commission not found');
    }

    // Also get related overrides
    const { data: overrides } = await supabase
      .from('overrides')
      .select('*, agents(id, first_name, last_name)')
      .eq('commission_id', id)
      .order('generation', { ascending: true });

    return NextResponse.json({
      commission: data,
      overrides: overrides || [],
    });
  } catch (error) {
    console.error('Admin commission GET error:', error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateCommissionSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = parseResult.data;

    // Check commission exists
    const { data: existing } = await supabase
      .from('commissions')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return notFoundResponse('Commission not found');
    }

    // Update commission
    const { data, error } = await supabase
      .from('commissions')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select('*, agents(id, first_name, last_name, email, agent_code)')
      .single();

    if (error) {
      console.error('Commission update error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin commission PATCH error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Check commission exists
    const { data: existing } = await supabase
      .from('commissions')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return notFoundResponse('Commission not found');
    }

    // Don't allow deleting paid commissions
    if ((existing as Commission).status === 'paid') {
      return badRequestResponse('Cannot delete a paid commission. Reverse it instead.');
    }

    // Delete related overrides first
    await supabase
      .from('overrides')
      .delete()
      .eq('commission_id', id);

    // Delete the commission
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Commission delete error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('Admin commission DELETE error:', error);
    return serverErrorResponse();
  }
}
