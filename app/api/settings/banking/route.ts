/**
 * Agent Banking Settings API
 * GET - Get agent's banking info
 * POST - Create/update banking info
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient } from '@/lib/db/supabase-server';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

// Banking info update schema
const bankingInfoSchema = z.object({
  // ACH Details
  bank_name: z.string().min(1, 'Bank name is required').optional(),
  account_holder_name: z.string().min(1, 'Account holder name is required').optional(),
  account_type: z.enum(['checking', 'savings']).optional(),
  routing_number: z.string().regex(/^\d{9}$/, 'Routing number must be 9 digits').optional(),
  account_number: z.string().min(4, 'Account number must be at least 4 digits').max(17, 'Account number too long').optional(),

  // Mailing Address (for checks/wires)
  mailing_address_line1: z.string().min(1).optional(),
  mailing_address_line2: z.string().optional(),
  mailing_city: z.string().min(1).optional(),
  mailing_state: z.string().length(2, 'State must be 2 letter code').optional(),
  mailing_zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional(),
  mailing_country: z.string().default('US'),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Get agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return ApiErrors.notFound('Agent');
    }

    const typedAgent = agent as { id: string };

    // Get banking info
    const { data: bankingInfo } = await supabase
      .from('agent_banking_info')
      .select('*')
      .eq('agent_id', typedAgent.id)
      .maybeSingle();

    // Don't return encrypted account number
    if (bankingInfo) {
      const safeInfo = { ...(bankingInfo as Record<string, unknown>) };
      delete safeInfo.account_number_encrypted;
      return apiSuccess({ banking_info: safeInfo });
    }

    return apiSuccess({ banking_info: null });
  } catch (error) {
    console.error('Banking info GET error:', error);
    return ApiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Get agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return ApiErrors.notFound('Agent');
    }

    const typedAgent = agent as { id: string; first_name: string; last_name: string };

    // Parse request body
    const body = await request.json();
    const parseResult = bankingInfoSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const data = parseResult.data;

    // Check if banking info exists
    const { data: existingInfo } = await supabase
      .from('agent_banking_info')
      .select('id')
      .eq('agent_id', typedAgent.id)
      .maybeSingle();

    // Prepare data for insert/update
    const bankingData: Record<string, unknown> = {
      agent_id: typedAgent.id,
      bank_name: data.bank_name,
      account_holder_name: data.account_holder_name || `${typedAgent.first_name} ${typedAgent.last_name}`,
      account_type: data.account_type || 'checking',
      mailing_address_line1: data.mailing_address_line1,
      mailing_address_line2: data.mailing_address_line2,
      mailing_city: data.mailing_city,
      mailing_state: data.mailing_state,
      mailing_zip: data.mailing_zip,
      mailing_country: data.mailing_country || 'US',
    };

    // Handle routing number
    if (data.routing_number) {
      bankingData.routing_number = data.routing_number;
    }

    // Handle account number - store last 4 and encrypted full number
    if (data.account_number) {
      bankingData.account_number_last4 = data.account_number.slice(-4);
      // In production, you'd encrypt this with a proper encryption service
      // For now, we'll store it as-is (Supabase has encryption at rest)
      bankingData.account_number_encrypted = data.account_number;
      // Reset verification when account changes
      bankingData.verification_status = 'pending';
      bankingData.verified_at = null;
    }

    let result;
    if (existingInfo) {
      // Update existing
      const { data: updated, error } = await adminClient
        .from('agent_banking_info')
        .update(bankingData as never)
        .eq('agent_id', typedAgent.id)
        .select()
        .single();

      if (error) {
        console.error('Banking info update error:', error);
        return ApiErrors.internal('Failed to update banking information');
      }
      result = updated;
    } else {
      // Insert new
      const { data: inserted, error } = await adminClient
        .from('agent_banking_info')
        .insert(bankingData as never)
        .select()
        .single();

      if (error) {
        console.error('Banking info insert error:', error);
        return ApiErrors.internal('Failed to save banking information');
      }
      result = inserted;
    }

    // Remove encrypted data from response
    if (result) {
      const safeResult = { ...(result as Record<string, unknown>) };
      delete safeResult.account_number_encrypted;
      return apiSuccess({
        banking_info: safeResult,
        message: existingInfo ? 'Banking information updated' : 'Banking information saved',
      });
    }

    return ApiErrors.internal();
  } catch (error) {
    console.error('Banking info POST error:', error);
    return ApiErrors.internal();
  }
}
