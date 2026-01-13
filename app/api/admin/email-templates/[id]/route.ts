/**
 * Admin Email Template API
 * GET - Get single template
 * PUT - Update template
 * DELETE - Delete template (non-system only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

// Type definitions for email templates (tables not yet in generated types)
interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  text_content: string | null;
  variables: string[];
  is_active: boolean;
  is_system: boolean;
  for_replicated_site: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailSendLog {
  status: string;
}

interface EmailTemplateVersion {
  version_number: number;
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

// Update template schema
const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  category: z.enum(EMAIL_CATEGORIES).optional(),
  subject: z.string().min(1).optional(),
  preview_text: z.string().optional().nullable(),
  html_content: z.string().min(1).optional(),
  text_content: z.string().optional().nullable(),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  for_replicated_site: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: templateData, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !templateData) {
      return notFoundResponse('Template not found');
    }

    const template = templateData as unknown as EmailTemplate;

    // Get version history
    const { data: versionsData } = await supabase
      .from('email_template_versions')
      .select('*')
      .eq('template_id', id)
      .order('version_number', { ascending: false })
      .limit(10);

    // Get send stats
    const { data: sendStatsData } = await supabase
      .from('email_send_logs')
      .select('status')
      .eq('template_id', id);

    const sendStats = (sendStatsData || []) as unknown as EmailSendLog[];
    const stats = {
      totalSent: sendStats.length,
      delivered: sendStats.filter(s => s.status === 'delivered').length,
      bounced: sendStats.filter(s => s.status === 'bounced').length,
      failed: sendStats.filter(s => s.status === 'failed').length,
    };

    return NextResponse.json({
      template,
      versions: versionsData || [],
      stats,
    });
  } catch (error) {
    console.error('Email template GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    // Get existing template
    const { data: existingData, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      return notFoundResponse('Template not found');
    }

    const existing = existingData as unknown as EmailTemplate;
    const updateData = parseResult.data;

    // Check if slug is being changed and already exists
    if (updateData.slug && updateData.slug !== existing.slug) {
      const { data: existingSlug } = await supabase
        .from('email_templates')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single();

      if (existingSlug) {
        return badRequestResponse('A template with this slug already exists');
      }
    }

    // Save current version to history if content changed
    if (updateData.html_content && updateData.html_content !== existing.html_content) {
      // Get next version number
      const { data: lastVersionData } = await supabase
        .from('email_template_versions')
        .select('version_number')
        .eq('template_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const lastVersion = lastVersionData as unknown as EmailTemplateVersion | null;
      const nextVersion = (lastVersion?.version_number || 0) + 1;

      await (supabase.from('email_template_versions') as unknown as {
        insert: (data: Record<string, unknown>) => Promise<unknown>;
      }).insert({
        template_id: id,
        version_number: nextVersion,
        subject: existing.subject,
        html_content: existing.html_content,
        text_content: existing.text_content,
        created_by: admin.agentId,
        notes: body.version_notes || 'Updated via admin',
      });
    }

    // Update template
    const { data: templateData, error: updateError } = await (supabase
      .from('email_templates') as unknown as {
        update: (data: Record<string, unknown>) => {
          eq: (col: string, val: string) => {
            select: () => { single: () => Promise<{ data: unknown; error: unknown }> }
          }
        }
      })
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        updated_by: admin.agentId,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Email template update error:', updateError);
      return serverErrorResponse();
    }

    return NextResponse.json({ template: templateData });
  } catch (error) {
    console.error('Email template PUT error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Check if template exists and is not a system template
    const { data: existingData, error: fetchError } = await supabase
      .from('email_templates')
      .select('id, is_system, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      return notFoundResponse('Template not found');
    }

    const existing = existingData as unknown as { id: string; is_system: boolean; name: string };

    if (existing.is_system) {
      return badRequestResponse('System templates cannot be deleted');
    }

    // Delete template (versions will cascade)
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Email template delete error:', deleteError);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true, message: `Template "${existing.name}" deleted` });
  } catch (error) {
    console.error('Email template DELETE error:', error);
    return serverErrorResponse();
  }
}
