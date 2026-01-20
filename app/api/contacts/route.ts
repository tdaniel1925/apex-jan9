import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import type { Agent, Contact, ContactInsert } from '@/lib/types/database';
import { applySanitization } from '@/lib/security/input-sanitizer';

// Zod schemas for validation
const contactCreateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  type: z.enum(['lead', 'customer', 'recruit']).default('lead'),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  type: z.enum(['lead', 'customer', 'recruit']).optional(),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent with explicit typing
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = queryParamsSchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { limit, offset, type, stage, search } = parseResult.data;

    // Build query
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('agent_id', agent.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data: contactsData, error, count } = await query;

    if (error) {
      console.error('Contacts fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contacts = (contactsData || []) as Contact[];

    return NextResponse.json({
      contacts,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent with explicit typing
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = contactCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;

    // PHASE 2 FIX - Issue #19: Sanitize user input to prevent XSS
    const sanitizedData = applySanitization(validatedData, {
      textFields: ['first_name', 'last_name', 'notes', 'source'],
      maxLengths: {
        notes: 5000,
        source: 255,
      },
    });

    // Build insert object with explicit typing
    const insertData: ContactInsert = {
      agent_id: agent.id,
      first_name: sanitizedData.first_name,
      last_name: sanitizedData.last_name,
      email: sanitizedData.email ?? null,
      phone: sanitizedData.phone ?? null,
      type: sanitizedData.type,
      stage: sanitizedData.stage,
      source: sanitizedData.source ?? null,
      notes: sanitizedData.notes ?? null,
    };

    // Create contact
    const { data: contactData, error } = await supabase
      .from('contacts')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Contact create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contact = contactData as Contact;

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Contacts POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
