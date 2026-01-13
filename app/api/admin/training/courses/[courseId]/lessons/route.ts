/**
 * Admin Course Lessons API
 * POST - Add a new lesson to a course
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Lesson } from '@/lib/types/training';

// Create lesson schema
const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  section_id: z.string().uuid().optional(),
  content_type: z.enum(['video', 'pdf', 'quiz', 'text', 'audio']),
  content_url: z.string().url().optional(),
  content_text: z.string().max(50000).optional(),
  duration_minutes: z.number().int().min(0).optional(),
  is_preview: z.boolean().default(false),
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
    const parseResult = createLessonSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const lessonData = parseResult.data;

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
    let order = lessonData.order;
    if (order === undefined) {
      const { data: lastLesson } = await supabase
        .from('lessons')
        .select('order')
        .eq('course_id', courseId)
        .order('order', { ascending: false })
        .limit(1)
        .single() as unknown as { data: { order: number } | null };
      order = (lastLesson?.order || 0) + 1;
    }

    const { data: lesson, error: createError } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        section_id: lessonData.section_id,
        title: lessonData.title,
        content_type: lessonData.content_type,
        content_url: lessonData.content_url,
        content_text: lessonData.content_text,
        duration_minutes: lessonData.duration_minutes,
        is_preview: lessonData.is_preview,
        order,
      } as never)
      .select()
      .single() as unknown as { data: Lesson | null; error: unknown };

    if (createError) {
      console.error('Lesson create error:', createError);
      return serverErrorResponse();
    }

    // Update course estimated minutes
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('duration_minutes')
      .eq('course_id', courseId) as unknown as { data: { duration_minutes: number | null }[] | null };

    const totalMinutes = (allLessons || []).reduce(
      (sum, l) => sum + (l.duration_minutes || 0),
      0
    );

    await supabase
      .from('courses')
      .update({ estimated_minutes: totalMinutes, updated_at: new Date().toISOString() } as never)
      .eq('id', courseId);

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Admin lesson POST error:', error);
    return serverErrorResponse();
  }
}
