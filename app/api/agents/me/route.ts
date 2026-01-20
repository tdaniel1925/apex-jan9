import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import type { Agent, AgentUpdate } from '@/lib/types/database';
import { applySanitization } from '@/lib/security/input-sanitizer';
import { validateUsername, isUsernameAvailable } from '@/lib/validation/username-validator';

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

    // PHASE 2 FIX - Issue #19: Sanitize user input to prevent XSS
    const updates: AgentUpdate = applySanitization(parseResult.data, {
      textFields: ['first_name', 'last_name', 'bio'],
      urlFields: ['avatar_url'],
      maxLengths: {
        bio: 1000,
      },
    });

    // PHASE 2 FIX - Issue #31: Validate username is URL-safe
    if (updates.username) {
      const usernameValidation = validateUsername(updates.username);
      if (!usernameValidation.valid) {
        return NextResponse.json(
          { error: usernameValidation.error },
          { status: 400 }
        );
      }

      // Check if username is available
      const { data: currentAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single() as { data: { id: string } | null };

      if (currentAgent) {
        const available = await isUsernameAvailable(
          usernameValidation.sanitized!,
          supabase,
          currentAgent.id
        );

        if (!available) {
          return NextResponse.json(
            { error: 'Username already taken. Please choose a different one.' },
            { status: 400 }
          );
        }
      }

      // Use sanitized version
      updates.username = usernameValidation.sanitized;
    }

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
