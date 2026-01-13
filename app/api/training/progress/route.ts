/**
 * Training Progress API
 * POST /api/training/progress - Update lesson progress (mark complete, save video position)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { updateLessonProgress } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

const progressUpdateSchema = z.object({
  course_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  completed: z.boolean().optional(),
  time_spent_seconds: z.number().int().min(0).optional(),
  last_position_seconds: z.number().int().min(0).optional(),
  quiz_score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
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

    // Parse and validate request body
    const body = await request.json();
    const parseResult = progressUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { course_id, lesson_id, ...updates } = parseResult.data;

    // Add completed_at if marking as completed
    const progressUpdates: Record<string, unknown> = { ...updates };
    if (updates.completed) {
      progressUpdates.completed_at = new Date().toISOString();
    }

    const progress = await updateLessonProgress(
      agent.id,
      course_id,
      lesson_id,
      progressUpdates
    );

    return apiSuccess({ progress });

  } catch (error) {
    console.error('Error in progress update API:', error);
    return ApiErrors.internal();
  }
}
