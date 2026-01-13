/**
 * Admin Training Progress API
 * GET - View all agent progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { CourseEnrollment, Course } from '@/lib/types/training';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  course_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  completed: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['enrolled_at', 'progress_percentage', 'completed_at']).default('enrolled_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

interface EnrollmentWithRelations extends CourseEnrollment {
  agent: { id: string; first_name: string; last_name: string; email: string; agent_code: string } | null;
  course: { id: string; title: string; category: string } | null;
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

    const { limit, offset, course_id, agent_id, completed, search, sort_by, sort_order } = parseResult.data;

    // Build query
    let query = supabase
      .from('course_enrollments')
      .select(`
        *,
        agent:agents(id, first_name, last_name, email, agent_code),
        course:courses(id, title, category)
      `, { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (completed === true) {
      query = query.not('completed_at', 'is', null);
    } else if (completed === false) {
      query = query.is('completed_at', null);
    }

    const { data: enrollments, error, count } = await query as unknown as {
      data: EnrollmentWithRelations[] | null;
      error: unknown;
      count: number | null
    };

    if (error) {
      console.error('Progress fetch error:', error);
      return serverErrorResponse();
    }

    // Filter by search if provided (agent name or email)
    let filteredEnrollments = enrollments || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEnrollments = filteredEnrollments.filter(e => {
        const agent = e.agent;
        if (!agent) return false;
        return (
          agent.first_name?.toLowerCase().includes(searchLower) ||
          agent.last_name?.toLowerCase().includes(searchLower) ||
          agent.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({
      enrollments: filteredEnrollments,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin progress GET error:', error);
    return serverErrorResponse();
  }
}
