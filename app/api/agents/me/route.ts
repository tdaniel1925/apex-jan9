import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import type { Agent, AgentUpdate } from '@/lib/types/database';

// Zod schema for agent updates
const agentUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agentData, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Agent fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const agent = agentData as Agent;

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Agent GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = agentUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updates: AgentUpdate = parseResult.data;

    const { data: agentData, error } = await supabase
      .from('agents')
      .update(updates as never)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Agent update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const agent = agentData as Agent;

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Agent PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
