/**
 * Admin Track Detail API
 * GET - Get track details with courses
 * PUT - Update track
 * DELETE - Delete track
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { TrainingTrack, Course } from '@/lib/types/training';

interface TrackCourseWithCourse {
  track_id: string;
  course_id: string;
  order: number;
  is_required: boolean;
  course: Course | null;
}

// Update track schema
const updateTrackSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url().nullable().optional(),
  track_type: z.enum(['new_agent', 'licensing', 'product', 'sales', 'leadership', 'compliance']).optional(),
  rank_requirement: z.string().nullable().optional(),
  estimated_hours: z.number().min(0).optional(),
  is_required: z.boolean().optional(),
  is_active: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  course_ids: z.array(z.string().uuid()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { trackId } = await params;
    const supabase = createAdminClient();

    // Get track
    const { data: track, error: trackError } = await supabase
      .from('training_tracks')
      .select('*')
      .eq('id', trackId)
      .single() as unknown as { data: TrainingTrack | null; error: unknown };

    if (trackError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Get track courses with course details
    const { data: trackCourses } = await supabase
      .from('track_courses')
      .select('*, course:courses(*)')
      .eq('track_id', trackId)
      .order('order', { ascending: true }) as unknown as { data: TrackCourseWithCourse[] | null };

    // Get enrollment stats
    const { count: totalEnrollments } = await supabase
      .from('track_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId) as unknown as { count: number | null };

    const { count: completedEnrollments } = await supabase
      .from('track_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId)
      .not('completed_at', 'is', null) as unknown as { count: number | null };

    return NextResponse.json({
      track: {
        ...track,
        courses: trackCourses?.map(tc => ({
          ...tc.course,
          track_order: tc.order,
          is_required: tc.is_required,
        })) || [],
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
    console.error('Admin track GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { trackId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateTrackSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { course_ids, ...updates } = parseResult.data;

    (updates as Record<string, unknown>).updated_at = new Date().toISOString();

    const { data: track, error: updateError } = await supabase
      .from('training_tracks')
      .update(updates as never)
      .eq('id', trackId)
      .select()
      .single() as unknown as { data: TrainingTrack | null; error: unknown };

    if (updateError) {
      console.error('Track update error:', updateError);
      return serverErrorResponse();
    }

    // Update track courses if provided
    if (course_ids !== undefined) {
      // Remove existing track courses
      await supabase.from('track_courses').delete().eq('track_id', trackId);

      // Add new track courses
      if (course_ids.length > 0) {
        const trackCourseData = course_ids.map((courseId, index) => ({
          track_id: trackId,
          course_id: courseId,
          order: index,
          is_required: true,
        }));

        await supabase.from('track_courses').insert(trackCourseData as never);
      }
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error('Admin track PUT error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { trackId } = await params;
    const supabase = createAdminClient();

    // Check if track has enrollments
    const { count: enrollments } = await supabase
      .from('track_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId) as unknown as { count: number | null };

    if (enrollments && enrollments > 0) {
      return badRequestResponse(
        'Cannot delete track with existing enrollments. Deactivate it instead.'
      );
    }

    const { error: deleteError } = await supabase
      .from('training_tracks')
      .delete()
      .eq('id', trackId);

    if (deleteError) {
      console.error('Track delete error:', deleteError);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin track DELETE error:', error);
    return serverErrorResponse();
  }
}
