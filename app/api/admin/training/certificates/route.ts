/**
 * Admin Training Certificates API
 * GET - List all certificates with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Certificate } from '@/lib/types/training';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  agent_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['issued_at', 'title', 'recipient_name']).default('issued_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

interface CertificateWithRelations extends Certificate {
  agent: { id: string; first_name: string; last_name: string; email: string; agent_code: string } | null;
  course: { id: string; title: string } | null;
  track: { id: string; title: string } | null;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { limit, offset, agent_id, course_id, search, sort_by, sort_order } = parseResult.data;

    // Build query
    let query = supabase
      .from('certificates')
      .select(`
        *,
        agent:agents(id, first_name, last_name, email, agent_code),
        course:courses(id, title),
        track:training_tracks(id, title)
      `, { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    const { data: certificates, error, count } = await query as unknown as {
      data: CertificateWithRelations[] | null;
      error: unknown;
      count: number | null
    };

    if (error) {
      console.error('Certificates fetch error:', error);
      return serverErrorResponse();
    }

    // Filter by search if provided (recipient name or certificate number)
    let filteredCertificates = certificates || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCertificates = filteredCertificates.filter(c => {
        return (
          c.recipient_name?.toLowerCase().includes(searchLower) ||
          c.certificate_number?.toLowerCase().includes(searchLower) ||
          c.title?.toLowerCase().includes(searchLower) ||
          c.agent?.first_name?.toLowerCase().includes(searchLower) ||
          c.agent?.last_name?.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({
      certificates: filteredCertificates,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin certificates GET error:', error);
    return serverErrorResponse();
  }
}
