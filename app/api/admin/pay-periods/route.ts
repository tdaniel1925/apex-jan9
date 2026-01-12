/**
 * Admin Pay Periods API
 * GET - List all pay periods with filters
 * POST - Create a new pay period
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import {
  verifyAdmin,
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
} from '@/lib/auth/admin-auth';
import {
  getCurrentPayPeriod,
  calculatePayPeriodDates,
  type PayPeriod,
} from '@/lib/engines/pay-period-engine';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['open', 'closed', 'processing', 'paid']).optional(),
  period_type: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  year: z.coerce.number().optional(),
  sort_by: z.enum(['created_at', 'start_date', 'total_amount']).default('start_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Create pay period schema
const createPayPeriodSchema = z.object({
  period_type: z.enum(['weekly', 'biweekly', 'monthly']),
  start_date: z.string().datetime().optional(), // If not provided, uses current period
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createUntypedAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { limit, offset, status, period_type, year, sort_by, sort_order } = parseResult.data;

    // Build query
    let query = supabase
      .from('pay_periods')
      .select('*', { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (period_type) {
      query = query.eq('period_type', period_type);
    }

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Pay periods fetch error:', error);
      return serverErrorResponse();
    }

    // Get summary stats
    const { data: statsData } = await supabase
      .from('pay_periods')
      .select('status, total_amount, agent_count');

    const stats = {
      total: statsData?.length || 0,
      open: statsData?.filter((p) => p.status === 'open').length || 0,
      closed: statsData?.filter((p) => p.status === 'closed').length || 0,
      processing: statsData?.filter((p) => p.status === 'processing').length || 0,
      paid: statsData?.filter((p) => p.status === 'paid').length || 0,
      totalPayout: statsData?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0,
      totalAgents: statsData?.reduce((sum, p) => sum + (p.agent_count || 0), 0) || 0,
    };

    // Get current period info
    const currentPeriod = getCurrentPayPeriod('monthly');

    return NextResponse.json({
      payPeriods: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
      currentPeriod: {
        periodNumber: currentPeriod.period_number,
        year: currentPeriod.year,
        status: currentPeriod.status,
      },
    });
  } catch (error) {
    console.error('Admin pay periods GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createUntypedAdminClient();
    const body = await request.json();
    const parseResult = createPayPeriodSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { period_type, start_date } = parseResult.data;

    // Calculate period dates
    const referenceDate = start_date ? new Date(start_date) : new Date();
    const periodDates = calculatePayPeriodDates(referenceDate, period_type);

    // Check if period already exists
    const { data: existing } = await supabase
      .from('pay_periods')
      .select('id')
      .eq('period_type', period_type)
      .eq('period_number', periodDates.periodNumber)
      .eq('year', periodDates.year)
      .single();

    if (existing) {
      return badRequestResponse(
        `Pay period ${period_type} #${periodDates.periodNumber}/${periodDates.year} already exists`
      );
    }

    // Create the pay period
    const payPeriodData: Partial<PayPeriod> = {
      period_type,
      period_number: periodDates.periodNumber,
      year: periodDates.year,
      start_date: periodDates.startDate.toISOString(),
      end_date: periodDates.endDate.toISOString(),
      cutoff_date: periodDates.cutoffDate.toISOString(),
      payout_date: periodDates.payoutDate.toISOString(),
      status: 'open',
      total_commissions: 0,
      total_overrides: 0,
      total_bonuses: 0,
      total_amount: 0,
      agent_count: 0,
    };

    const { data: payPeriod, error: insertError } = await supabase
      .from('pay_periods')
      .insert(payPeriodData)
      .select()
      .single();

    if (insertError) {
      console.error('Pay period insert error:', insertError);
      return serverErrorResponse();
    }

    return NextResponse.json(
      {
        payPeriod,
        message: `Pay period ${period_type} #${periodDates.periodNumber}/${periodDates.year} created`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin pay periods POST error:', error);
    return serverErrorResponse();
  }
}
