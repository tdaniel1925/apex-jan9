/**
 * Course Enrollment API
 * POST /api/training/courses/[courseId]/enroll - Enroll in a course
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { enrollInCourse } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (agentError || !agent) {
      return ApiErrors.notFound('Agent');
    }

    const enrollment = await enrollInCourse(agent.id, courseId);

    return apiSuccess({ enrollment });

  } catch (error) {
    console.error('Error in course enrollment API:', error);
    return ApiErrors.internal();
  }
}
