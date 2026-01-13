/**
 * Training Certificates API
 * GET /api/training/certificates - Get agent's certificates
 */

import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getAgentCertificates } from '@/lib/services/training-service';
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

    const certificates = await getAgentCertificates(agent.id);

    return apiSuccess({ certificates });

  } catch (error) {
    console.error('Error in certificates API:', error);
    return ApiErrors.internal();
  }
}
