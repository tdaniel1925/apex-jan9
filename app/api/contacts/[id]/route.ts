import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import type { Agent, Contact, ContactUpdate } from '@/lib/types/database';
import { applySanitization } from '@/lib/security/input-sanitizer';

// Zod schema for contact updates
const contactUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  type: z.enum(['lead', 'customer', 'recruit']).optional(),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  last_contacted_at: z.string().datetime().nullable().optional(),
  next_follow_up_at: z.string().datetime().nullable().optional(),
});

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid contact ID');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const idParseResult = uuidSchema.safeParse(id);
    if (!idParseResult.success) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent with explicit typing
    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Get contact
    const { data: contactData, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('agent_id', agent.id)
      .single();

    if (error || !contactData) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contact = contactData as Contact;

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Contact GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const idParseResult = uuidSchema.safeParse(id);
    if (!idParseResult.success) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent with explicit typing
    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = contactUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // PHASE 2 FIX - Issue #19: Sanitize user input to prevent XSS
    const updates: ContactUpdate = applySanitization(parseResult.data, {
      textFields: ['first_name', 'last_name', 'notes', 'source'],
      maxLengths: {
        notes: 5000,
        source: 255,
      },
    });

    // Update contact
    const { data: contactData, error } = await supabase
      .from('contacts')
      .update(updates as never)
      .eq('id', id)
      .eq('agent_id', agent.id)
      .select()
      .single();

    if (error) {
      console.error('Contact update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!contactData) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contact = contactData as Contact;

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Contact PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const idParseResult = uuidSchema.safeParse(id);
    if (!idParseResult.success) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent with explicit typing
    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Delete contact
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('agent_id', agent.id);

    if (error) {
      console.error('Contact delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
