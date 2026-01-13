/**
 * Admin Lesson Detail API
 * GET - Get lesson details
 * PUT - Update lesson
 * DELETE - Delete lesson
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Quiz } from '@/lib/types/training';

interface LessonWithRelations {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number | null;
  is_preview: boolean;
  order: number;
  course: { id: string; title: string } | null;
  section: { id: string; title: string } | null;
}

// Update lesson schema
const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  section_id: z.string().uuid().nullable().optional(),
  content_type: z.enum(['video', 'pdf', 'quiz', 'text', 'audio']).optional(),
  content_url: z.string().url().nullable().optional(),
  content_text: z.string().max(50000).nullable().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  is_preview: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { lessonId } = await params;
    const supabase = createAdminClient();

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*, course:courses(id, title), section:course_sections(id, title)')
      .eq('id', lessonId)
      .single() as unknown as { data: LessonWithRelations | null; error: unknown };

    if (error || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Get associated quiz if any
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .single() as unknown as { data: Quiz | null };

    return NextResponse.json({
      lesson: {
        ...lesson,
        quiz,
      },
    });
  } catch (error) {
    console.error('Admin lesson GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { lessonId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateLessonSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = {
      ...parseResult.data,
      updated_at: new Date().toISOString(),
    };

    const { data: lesson, error: updateError } = await supabase
      .from('lessons')
      .update(updates as never)
      .eq('id', lessonId)
      .select('*, course_id')
      .single() as unknown as { data: { id: string; course_id: string } | null; error: unknown };

    if (updateError || !lesson) {
      console.error('Lesson update error:', updateError);
      return serverErrorResponse();
    }

    // Update course estimated minutes if duration changed
    if (parseResult.data.duration_minutes !== undefined) {
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('duration_minutes')
        .eq('course_id', lesson.course_id) as unknown as { data: { duration_minutes: number | null }[] | null };

      const totalMinutes = (allLessons || []).reduce(
        (sum, l) => sum + (l.duration_minutes || 0),
        0
      );

      await supabase
        .from('courses')
        .update({ estimated_minutes: totalMinutes, updated_at: new Date().toISOString() } as never)
        .eq('id', lesson.course_id);
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Admin lesson PUT error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { lessonId } = await params;
    const supabase = createAdminClient();

    // Get lesson to check course_id
    const { data: lesson } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single() as unknown as { data: { course_id: string } | null };

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (deleteError) {
      console.error('Lesson delete error:', deleteError);
      return serverErrorResponse();
    }

    // Update course estimated minutes
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('duration_minutes')
      .eq('course_id', lesson.course_id) as unknown as { data: { duration_minutes: number | null }[] | null };

    const totalMinutes = (allLessons || []).reduce(
      (sum, l) => sum + (l.duration_minutes || 0),
      0
    );

    await supabase
      .from('courses')
      .update({ estimated_minutes: totalMinutes, updated_at: new Date().toISOString() } as never)
      .eq('id', lesson.course_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin lesson DELETE error:', error);
    return serverErrorResponse();
  }
}
