/**
 * Training Resources API
 * GET /api/training/resources - Get downloadable resources library
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getResources, recordResourceDownload } from '@/lib/services/training-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent by user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, rank')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string; rank: string } | null; error: unknown };

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
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

    return NextResponse.json({ resources });

  } catch (error) {
    console.error('Error in resources API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent by user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { resource_id } = body;

    if (!resource_id) {
      return NextResponse.json(
        { error: 'resource_id is required' },
        { status: 400 }
      );
    }

    // Record download
    await recordResourceDownload(agent.id, resource_id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error recording download:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
