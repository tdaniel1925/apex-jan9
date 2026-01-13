/**
 * Training Tracks API
 * GET /api/training/tracks - Get all learning paths with agent progress
 */

import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getTracksForAgent } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function GET() {
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

    const tracks = await getTracksForAgent(agent.id);

    return apiSuccess({ tracks });

  } catch (error) {
    console.error('Error in training tracks API:', error);
    return ApiErrors.internal();
  }
}
