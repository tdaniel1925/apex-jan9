/**
 * Admin Training Course Detail API
 * GET - Get course details with sections and lessons
 * PUT - Update course
 * DELETE - Delete course
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { generateSlug } from '@/lib/services/training-service';
import type { Course, CourseSection, Lesson, Quiz } from '@/lib/types/training';

// Update course schema
const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(['onboarding', 'products', 'sales', 'recruiting', 'compliance']).optional(),
  thumbnail: z.string().url().nullable().optional(),
  instructor_name: z.string().max(100).nullable().optional(),
  instructor_avatar: z.string().url().nullable().optional(),
  estimated_minutes: z.number().int().min(0).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_required: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  prerequisites: z.array(z.string().uuid()).optional(),
  learning_objectives: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  order: z.number().int().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { courseId } = await params;
    const supabase = createAdminClient();

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single() as unknown as { data: Course | null; error: unknown };

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get sections
    const { data: sections } = await supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order', { ascending: true }) as unknown as { data: CourseSection[] | null };

    // Get lessons
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order', { ascending: true }) as unknown as { data: Lesson[] | null };

    // Get quizzes
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId) as unknown as { data: Quiz[] | null };

    // Get enrollment stats
    const { count: totalEnrollments } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId) as unknown as { count: number | null };

    const { count: completedEnrollments } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .not('completed_at', 'is', null) as unknown as { count: number | null };

    // Build sections with lessons
    const sectionsWithLessons = (sections || []).map(section => ({
      ...section,
      lessons: (lessons || []).filter(l => l.section_id === section.id),
    }));

    // Orphan lessons (no section)
    const orphanLessons = (lessons || []).filter(l => !l.section_id);

    return NextResponse.json({
      course: {
        ...course,
        sections: sectionsWithLessons,
        orphan_lessons: orphanLessons,
        quizzes: quizzes || [],
        stats: {
          total_enrollments: totalEnrollments || 0,
          completed_enrollments: completedEnrollments || 0,
          completion_rate: totalEnrollments
            ? Math.round(((completedEnrollments || 0) / totalEnrollments) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Admin course GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { courseId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateCourseSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = parseResult.data;

    // If title changed, update slug
    if (updates.title) {
      const slug = generateSlug(updates.title);
      const { data: existingSlug } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .neq('id', courseId)
        .single() as unknown as { data: { id: string } | null };

      (updates as Record<string, unknown>).slug = existingSlug ? `${slug}-${Date.now()}` : slug;
    }

    // If status changed to published and was not published before
    if (updates.status === 'published') {
      const { data: existing } = await supabase
        .from('courses')
        .select('status')
        .eq('id', courseId)
        .single() as unknown as { data: { status: string } | null };

      if (existing?.status !== 'published') {
        (updates as Record<string, unknown>).published_at = new Date().toISOString();
      }
    }

    (updates as Record<string, unknown>).updated_at = new Date().toISOString();

    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update(updates as never)
      .eq('id', courseId)
      .select()
      .single() as unknown as { data: Course | null; error: unknown };

    if (updateError) {
      console.error('Course update error:', updateError);
      return serverErrorResponse();
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Admin course PUT error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { courseId } = await params;
    const supabase = createAdminClient();

    // Check if course has enrollments
    const { count: enrollments } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId) as unknown as { count: number | null };

    if (enrollments && enrollments > 0) {
      return badRequestResponse(
        'Cannot delete course with existing enrollments. Archive it instead.'
      );
    }

    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (deleteError) {
      console.error('Course delete error:', deleteError);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin course DELETE error:', error);
    return serverErrorResponse();
  }
}
