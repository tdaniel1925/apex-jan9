/**
 * Admin Course Sections API
 * POST - Add a new section to a course
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { CourseSection } from '@/lib/types/training';

// Create section schema
const createSectionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { courseId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createSectionSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const sectionData = parseResult.data;

    // Verify course exists
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single() as unknown as { data: { id: string } | null };

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get next order if not provided
    let order = sectionData.order;
    if (order === undefined) {
      const { data: lastSection } = await supabase
        .from('course_sections')
        .select('order')
        .eq('course_id', courseId)
        .order('order', { ascending: false })
        .limit(1)
        .single() as unknown as { data: { order: number } | null };
      order = (lastSection?.order || 0) + 1;
    }

    const { data: section, error: createError } = await supabase
      .from('course_sections')
      .insert({
        course_id: courseId,
        title: sectionData.title,
        description: sectionData.description,
        order,
      } as never)
      .select()
      .single() as unknown as { data: CourseSection | null; error: unknown };

    if (createError) {
      console.error('Section create error:', createError);
      return serverErrorResponse();
    }

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Admin section POST error:', error);
    return serverErrorResponse();
  }
}
