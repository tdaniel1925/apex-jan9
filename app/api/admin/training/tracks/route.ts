/**
 * Admin Training Tracks API
 * GET - List all learning paths
 * POST - Create a new track
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { TRACK_TYPE_LABELS } from '@/lib/types/training';
import type { TrainingTrack } from '@/lib/types/training';

interface TrackCourseRow { track_id: string; course_id: string }
interface TrackEnrollmentRow { track_id: string }

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  track_type: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// Create track schema
const createTrackSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url().optional(),
  track_type: z.enum(['new_agent', 'licensing', 'product', 'sales', 'leadership', 'compliance']),
  rank_requirement: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  is_required: z.boolean().default(false),
  is_active: z.boolean().default(true),
  order: z.number().int().min(0).optional(),
  course_ids: z.array(z.string().uuid()).optional(),
});

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

    const { limit, offset, track_type, is_active, search } = parseResult.data;

    // Build query
    let query = supabase
      .from('training_tracks')
      .select('*', { count: 'exact' })
      .order('order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (track_type) {
      query = query.eq('track_type', track_type);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: tracks, error, count } = await query as unknown as {
      data: TrainingTrack[] | null;
      error: unknown;
      count: number | null
    };

    if (error) {
      console.error('Tracks fetch error:', error);
      return serverErrorResponse();
    }

    // Get course counts per track
    const { data: trackCourses } = await supabase
      .from('track_courses')
      .select('track_id, course_id') as unknown as { data: TrackCourseRow[] | null };

    const trackCourseCounts = new Map<string, number>();
    trackCourses?.forEach(tc => {
      trackCourseCounts.set(tc.track_id, (trackCourseCounts.get(tc.track_id) || 0) + 1);
    });

    // Get enrollment counts per track
    const { data: enrollments } = await supabase
      .from('track_enrollments')
      .select('track_id') as unknown as { data: TrackEnrollmentRow[] | null };

    const trackEnrollmentCounts = new Map<string, number>();
    enrollments?.forEach(e => {
      trackEnrollmentCounts.set(e.track_id, (trackEnrollmentCounts.get(e.track_id) || 0) + 1);
    });

    // Enrich tracks
    const tracksWithCounts = (tracks || []).map(track => ({
      ...track,
      courses_count: trackCourseCounts.get(track.id) || 0,
      enrollments_count: trackEnrollmentCounts.get(track.id) || 0,
    }));

    return NextResponse.json({
      tracks: tracksWithCounts,
      total: count || 0,
      limit,
      offset,
      labels: {
        trackTypes: TRACK_TYPE_LABELS,
      },
    });
  } catch (error) {
    console.error('Admin tracks GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createTrackSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { course_ids, ...trackData } = parseResult.data;

    // Get next order if not provided
    let order = trackData.order;
    if (order === undefined) {
      const { data: lastTrack } = await supabase
        .from('training_tracks')
        .select('order')
        .order('order', { ascending: false })
        .limit(1)
        .single() as unknown as { data: { order: number } | null };
      order = (lastTrack?.order || 0) + 1;
    }

    // Create track
    const { data: track, error: createError } = await supabase
      .from('training_tracks')
      .insert({
        ...trackData,
        order,
      } as never)
      .select()
      .single() as unknown as { data: TrainingTrack | null; error: unknown };

    if (createError || !track) {
      console.error('Track create error:', createError);
      return serverErrorResponse();
    }

    // Add courses to track if provided
    if (course_ids && course_ids.length > 0) {
      const trackCourseData = course_ids.map((courseId, index) => ({
        track_id: track.id,
        course_id: courseId,
        order: index,
        is_required: true,
      }));

      await supabase.from('track_courses').insert(trackCourseData as never);
    }

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error('Admin tracks POST error:', error);
    return serverErrorResponse();
  }
}
