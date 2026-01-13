/**
 * CRM Bulk Import/Export API
 * GET - Export contacts as CSV
 * POST - Import contacts from CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/supabase-server';
import { z } from 'zod';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  type: string;
  stage: string;
  source: string | null;
  company: string | null;
  job_title: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}

const importRowSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  type: z.enum(['lead', 'client', 'recruit_prospect', 'agent']).default('lead'),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
  source: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  address_line1: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(), // Comma-separated tags
});

// Export contacts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as { id: string };

    // Get contacts
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false });

    if (contactsError) {
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    const contacts = (contactsData || []) as Contact[];

    // Generate CSV
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'type',
      'stage',
      'source',
      'company',
      'job_title',
      'address_line1',
      'city',
      'state',
      'zip_code',
      'notes',
      'tags',
      'created_at',
    ];

    const csvRows = [
      headers.join(','),
      ...contacts.map((contact) => {
        return [
          escapeCsvField(contact.first_name),
          escapeCsvField(contact.last_name),
          escapeCsvField(contact.email || ''),
          escapeCsvField(contact.phone || ''),
          contact.type,
          contact.stage,
          escapeCsvField(contact.source || ''),
          escapeCsvField(contact.company || ''),
          escapeCsvField(contact.job_title || ''),
          escapeCsvField(contact.address_line1 || ''),
          escapeCsvField(contact.city || ''),
          escapeCsvField(contact.state || ''),
          escapeCsvField(contact.zip_code || ''),
          escapeCsvField(contact.notes || ''),
          escapeCsvField((contact.tags || []).join('; ')),
          contact.created_at,
        ].join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('CRM export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Import contacts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as { id: string };

    // Parse request body
    const body = await request.json();
    const { contacts: importData, skipDuplicates = true } = body;

    if (!Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json({ error: 'No contacts to import' }, { status: 400 });
    }

    // Validate and prepare contacts
    const validContacts: Array<Record<string, unknown>> = [];
    const errors: Array<{ row: number; errors: string[] }> = [];

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      const result = importRowSchema.safeParse(row);

      if (!result.success) {
        errors.push({
          row: i + 1,
          errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        continue;
      }

      const data = result.data;

      // Parse tags
      const tags = data.tags
        ? data.tags.split(/[,;]/).map((t: string) => t.trim()).filter(Boolean)
        : [];

      validContacts.push({
        agent_id: agent.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
        type: data.type,
        stage: data.stage,
        source: data.source || null,
        company: data.company || null,
        job_title: data.job_title || null,
        address_line1: data.address_line1 || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zip_code || null,
        notes: data.notes || null,
        tags,
      });
    }

    if (validContacts.length === 0) {
      return NextResponse.json({
        error: 'No valid contacts to import',
        errors,
      }, { status: 400 });
    }

    // Check for duplicates if skipDuplicates is enabled
    let duplicateCount = 0;
    if (skipDuplicates) {
      // Get existing emails
      const existingEmails = new Set<string>();
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('email')
        .eq('agent_id', agent.id)
        .not('email', 'is', null);

      (existingContacts || []).forEach((c: { email: string | null }) => {
        if (c.email) existingEmails.add(c.email.toLowerCase());
      });

      // Filter out duplicates
      const uniqueContacts = validContacts.filter((c) => {
        const email = c.email as string | null;
        if (email && existingEmails.has(email.toLowerCase())) {
          duplicateCount++;
          return false;
        }
        return true;
      });

      if (uniqueContacts.length === 0) {
        return NextResponse.json({
          success: true,
          imported: 0,
          duplicates: duplicateCount,
          errors,
          message: 'All contacts were duplicates',
        });
      }

      // Insert unique contacts
      const { error: insertError } = await supabase
        .from('contacts')
        .insert(uniqueContacts as never);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        imported: uniqueContacts.length,
        duplicates: duplicateCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully imported ${uniqueContacts.length} contacts`,
      });
    }

    // Insert all contacts (no duplicate check)
    const { error: insertError } = await supabase
      .from('contacts')
      .insert(validContacts as never);

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: validContacts.length,
      duplicates: 0,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${validContacts.length} contacts`,
    });
  } catch (error) {
    console.error('CRM import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeCsvField(value: string): string {
  if (!value) return '';
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
