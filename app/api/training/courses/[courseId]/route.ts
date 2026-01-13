/**
 * Training Course Detail API
 * GET /api/training/courses/[courseId] - Get course details with lessons
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getCourseWithLessons } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function GET(
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

    const course = await getCourseWithLessons(courseId, agent.id);

    if (!course) {
      return ApiErrors.notFound('Course');
    }

    return apiSuccess({ course });

  } catch (error) {
    console.error('Error in course detail API:', error);
    return ApiErrors.internal();
  }
}
