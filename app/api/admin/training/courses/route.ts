/**
 * Admin Training Courses API
 * GET - List all courses with filters
 * POST - Create a new course
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { generateSlug } from '@/lib/services/training-service';
import { COURSE_CATEGORY_LABELS, SKILL_LEVEL_LABELS, COURSE_STATUS_LABELS, Course } from '@/lib/types/training';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  status: z.string().optional(),
  skill_level: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'title', 'order', 'status']).default('order'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Create course schema
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['onboarding', 'products', 'sales', 'recruiting', 'compliance']),
  thumbnail: z.string().url().optional(),
  instructor_name: z.string().max(100).optional(),
  instructor_avatar: z.string().url().optional(),
  estimated_minutes: z.number().int().min(0).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  is_required: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  prerequisites: z.array(z.string().uuid()).optional(),
  learning_objectives: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  order: z.number().int().min(0).optional(),
});

interface LessonRow { course_id: string }
interface EnrollmentRow { course_id: string }
interface CourseStatsRow { status: string; category: string }

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

    const { limit, offset, category, status, skill_level, search, sort_by, sort_order } = parseResult.data;

    // Build query
    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (skill_level) {
      query = query.eq('skill_level', skill_level);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query as unknown as { data: Course[] | null; error: unknown; count: number | null };

    if (error) {
      console.error('Courses fetch error:', error);
      return serverErrorResponse();
    }

    // Get lesson counts per course
    const { data: lessonCounts } = await supabase
      .from('lessons')
      .select('course_id') as unknown as { data: LessonRow[] | null };

    const courseLessonCounts = new Map<string, number>();
    lessonCounts?.forEach(l => {
      courseLessonCounts.set(l.course_id, (courseLessonCounts.get(l.course_id) || 0) + 1);
    });

    // Get enrollment counts per course
    const { data: enrollmentCounts } = await supabase
      .from('course_enrollments')
      .select('course_id') as unknown as { data: EnrollmentRow[] | null };

    const courseEnrollmentCounts = new Map<string, number>();
    enrollmentCounts?.forEach(e => {
      courseEnrollmentCounts.set(e.course_id, (courseEnrollmentCounts.get(e.course_id) || 0) + 1);
    });

    // Enrich courses with counts
    const coursesWithCounts = (data || []).map(course => ({
      ...course,
      lessons_count: courseLessonCounts.get(course.id) || 0,
      enrollments_count: courseEnrollmentCounts.get(course.id) || 0,
    }));

    // Get summary stats
    const { data: allCourses } = await supabase.from('courses').select('status, category') as unknown as { data: CourseStatsRow[] | null };
    const stats = {
      total: allCourses?.length || 0,
      published: allCourses?.filter(c => c.status === 'published').length || 0,
      draft: allCourses?.filter(c => c.status === 'draft').length || 0,
      archived: allCourses?.filter(c => c.status === 'archived').length || 0,
    };

    return NextResponse.json({
      courses: coursesWithCounts,
      total: count || 0,
      limit,
      offset,
      stats,
      labels: {
        categories: COURSE_CATEGORY_LABELS,
        skillLevels: SKILL_LEVEL_LABELS,
        statuses: COURSE_STATUS_LABELS,
      },
    });
  } catch (error) {
    console.error('Admin courses GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createCourseSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const courseData = parseResult.data;

    // Generate slug from title
    const slug = generateSlug(courseData.title);

    // Check for duplicate slug
    const { data: existingSlug } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single() as unknown as { data: { id: string } | null };

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Get next order number if not provided
    let order = courseData.order;
    if (order === undefined) {
      const { data: lastCourse } = await supabase
        .from('courses')
        .select('order')
        .order('order', { ascending: false })
        .limit(1)
        .single() as unknown as { data: { order: number } | null };
      order = (lastCourse?.order || 0) + 1;
    }

    // Create course
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        slug: finalSlug,
        order,
        prerequisites: courseData.prerequisites || [],
        learning_objectives: courseData.learning_objectives || [],
        published_at: courseData.status === 'published' ? new Date().toISOString() : null,
      } as never)
      .select()
      .single() as unknown as { data: Course | null; error: unknown };

    if (createError) {
      console.error('Course create error:', createError);
      return serverErrorResponse();
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Admin courses POST error:', error);
    return serverErrorResponse();
  }
}
