/**
 * Training Stats API
 * GET /api/training/stats - Get agent's training statistics, streaks, achievements
 */

import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getAgentTrainingStats } from '@/lib/services/training-service';
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

    const stats = await getAgentTrainingStats(agent.id);

    return apiSuccess({ stats });

  } catch (error) {
    console.error('Error in training stats API:', error);
    return ApiErrors.internal();
  }
}
