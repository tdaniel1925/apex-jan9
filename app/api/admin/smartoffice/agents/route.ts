/**
 * SmartOffice Agents API
 * GET - List imported SmartOffice agents
 * POST - Map a SmartOffice agent to an Apex agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { getSmartOfficeSyncService } from '@/lib/smartoffice';

// Query params schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  filter: z.enum(['all', 'mapped', 'unmapped']).default('all'),
  search: z.string().optional(),
});

// Map request schema
const mapSchema = z.object({
  smartoffice_agent_id: z.string().uuid(),
  apex_agent_id: z.string().uuid().nullable(),
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

    const { page, limit, filter, search } = parseResult.data;
    const offset = (page - 1) * limit;

    const supabase = createUntypedAdminClient();

    // Build query
    let query = supabase
      .from('smartoffice_agents')
      .select(
        `
        *,
        apex_agent:agents!smartoffice_agents_apex_agent_id_fkey(
          id,
          first_name,
          last_name,
          email,
          agent_code,
          rank,
          status
        )
      `,
        { count: 'exact' }
      )
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    // Apply filters
    if (filter === 'mapped') {
      query = query.not('apex_agent_id', 'is', null);
    } else if (filter === 'unmapped') {
      query = query.is('apex_agent_id', null);
    }

    // Apply search
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('SmartOffice agents query error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json({
      agents: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filter,
    });
  } catch (error) {
    console.error('SmartOffice agents GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json();
    const parseResult = mapSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Invalid request', parseResult.error.flatten());
    }

    const { smartoffice_agent_id, apex_agent_id } = parseResult.data;
    const syncService = getSmartOfficeSyncService();

    if (apex_agent_id) {
      await syncService.mapAgent(smartoffice_agent_id, apex_agent_id);
    } else {
      await syncService.unmapAgent(smartoffice_agent_id);
    }

    return NextResponse.json({
      success: true,
      message: apex_agent_id ? 'Agent mapped successfully' : 'Agent unmapped successfully',
    });
  } catch (error) {
    console.error('SmartOffice agents POST error:', error);
    return serverErrorResponse(error instanceof Error ? error.message : 'Mapping failed');
  }
}
