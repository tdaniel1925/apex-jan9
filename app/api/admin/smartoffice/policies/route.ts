/**
 * SmartOffice Policies API
 * GET - List imported SmartOffice policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

// Query params schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  agent_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { page, limit, search, agent_id } = parseResult.data;
    const offset = (page - 1) * limit;

    const supabase = createUntypedAdminClient();

    // Build query
    let query = supabase
      .from('smartoffice_policies')
      .select(
        `
        *,
        smartoffice_agent:smartoffice_agents!smartoffice_policies_smartoffice_agent_id_fkey(
          id,
          first_name,
          last_name,
          email,
          apex_agent_id
        )
      `,
        { count: 'exact' }
      )
      .order('synced_at', { ascending: false });

    // Filter by agent
    if (agent_id) {
      query = query.eq('smartoffice_agent_id', agent_id);
    }

    // Apply search
    if (search) {
      query = query.or(`policy_number.ilike.%${search}%,carrier_name.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('SmartOffice policies query error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json({
      policies: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('SmartOffice policies GET error:', error);
    return serverErrorResponse();
  }
}
