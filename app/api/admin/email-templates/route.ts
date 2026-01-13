/**
 * Admin Email Templates API
 * GET - List all email templates
 * POST - Create a new email template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

// Type definitions for email templates (tables not yet in generated types)
interface EmailTemplateRow {
  category: string;
  is_active: boolean;
}

const EMAIL_CATEGORIES = [
  'welcome',
  'onboarding',
  'commissions',
  'notifications',
  'marketing',
  'team',
  'compliance',
  'system',
] as const;

// Query params schema
const querySchema = z.object({
  category: z.enum(EMAIL_CATEGORIES).optional(),
  is_active: z.coerce.boolean().optional(),
  for_replicated_site: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// Create template schema
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  category: z.enum(EMAIL_CATEGORIES),
  subject: z.string().min(1, 'Subject is required'),
  preview_text: z.string().optional(),
  html_content: z.string().min(1, 'HTML content is required'),
  text_content: z.string().optional(),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  for_replicated_site: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { category, is_active, for_replicated_site, search } = parseResult.data;

    let query = supabase
      .from('email_templates')
      .select('*')
      .order('category')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    if (for_replicated_site !== undefined) {
      query = query.eq('for_replicated_site', for_replicated_site);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Email templates fetch error:', error);
      return serverErrorResponse();
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('email_templates')
      .select('category, is_active');

    const statsRows = (statsData || []) as unknown as EmailTemplateRow[];
    const stats = {
      total: statsRows.length,
      active: statsRows.filter(t => t.is_active).length,
      byCategory: EMAIL_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = statsRows.filter(t => t.category === cat).length;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      templates: data || [],
      stats,
    });
  } catch (error) {
    console.error('Email templates GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const templateData = parseResult.data;

    // Check if slug already exists
    const { data: existingSlug } = await supabase
      .from('email_templates')
      .select('id')
      .eq('slug', templateData.slug)
      .single();

    if (existingSlug) {
      return badRequestResponse('A template with this slug already exists');
    }

    // Create template
    const { data: template, error } = await (supabase
      .from('email_templates') as unknown as {
        insert: (data: Record<string, unknown>) => {
          select: () => { single: () => Promise<{ data: unknown; error: unknown }> }
        }
      })
      .insert({
        ...templateData,
        variables: templateData.variables || [],
        created_by: admin.agentId,
        updated_by: admin.agentId,
      })
      .select()
      .single();

    if (error) {
      console.error('Email template create error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Email templates POST error:', error);
    return serverErrorResponse();
  }
}
