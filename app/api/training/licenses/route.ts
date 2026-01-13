/**
 * Agent Licenses API
 * GET /api/training/licenses - Get agent's insurance licenses
 * POST /api/training/licenses - Add/update a license
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getAgentLicenses, upsertAgentLicense } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

const licenseSchema = z.object({
  state_code: z.string().length(2).toUpperCase(),
  license_type: z.enum(['life', 'health', 'life_and_health', 'variable']),
  license_number: z.string().max(50).optional(),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ce_credits_required: z.number().int().min(0).max(100).optional(),
  ce_credits_completed: z.number().int().min(0).max(100).optional(),
  status: z.enum(['active', 'expired', 'pending', 'suspended']).optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (agentError || !agent) {
      return ApiErrors.notFound('Agent');
    }

    const licenses = await getAgentLicenses(agent.id);

    return apiSuccess({ licenses });

  } catch (error) {
    console.error('Error in licenses API:', error);
    return ApiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (agentError || !agent) {
      return ApiErrors.notFound('Agent');
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = licenseSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    // Add default status if not provided
    const licenseData = {
      ...parseResult.data,
      status: parseResult.data.status || 'active',
    };

    const license = await upsertAgentLicense(agent.id, licenseData as never);

    return apiSuccess({ license });

  } catch (error) {
    console.error('Error in license update API:', error);
    return ApiErrors.internal();
  }
}
