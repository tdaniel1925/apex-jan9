/**
 * Training Resources API
 * GET /api/training/resources - Get downloadable resources library
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getResources, recordResourceDownload } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, rank')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string; rank: string } | null; error: unknown };

    if (agentError || !agent) {
      return ApiErrors.notFound('Agent');
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    const resources = await getResources(agent.rank as never, {
      category,
      type,
      search,
    });

    return apiSuccess({ resources });

  } catch (error) {
    console.error('Error in resources API:', error);
    return ApiErrors.internal();
  }
}

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

    // Parse request body
    const body = await request.json();
    const { resource_id } = body;

    if (!resource_id) {
      return ApiErrors.badRequest('resource_id is required');
    }

    // Record download
    await recordResourceDownload(agent.id, resource_id);

    return apiSuccess({ success: true });

  } catch (error) {
    console.error('Error recording download:', error);
    return ApiErrors.internal();
  }
}
