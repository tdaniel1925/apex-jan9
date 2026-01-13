/**
 * Admin Resource Detail API
 * GET - Get resource details
 * PUT - Update resource
 * DELETE - Delete resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Resource } from '@/lib/types/training';

// Update resource schema
const updateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  resource_type: z.enum(['pdf', 'document', 'spreadsheet', 'video', 'audio', 'link', 'image']).optional(),
  resource_category: z.enum([
    'forms', 'scripts', 'presentations', 'guides',
    'carrier_materials', 'compliance', 'marketing', 'state_licensing'
  ]).optional(),
  file_url: z.string().url().nullable().optional(),
  file_size_bytes: z.number().int().min(0).optional(),
  external_url: z.string().url().nullable().optional(),
  thumbnail: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  is_downloadable: z.boolean().optional(),
  is_active: z.boolean().optional(),
  rank_requirement: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { resourceId } = await params;
    const supabase = createAdminClient();

    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single() as unknown as { data: Resource | null; error: unknown };

    if (error || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Admin resource GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { resourceId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateResourceSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = {
      ...parseResult.data,
      updated_at: new Date().toISOString(),
    };

    const { data: resource, error: updateError } = await supabase
      .from('resources')
      .update(updates as never)
      .eq('id', resourceId)
      .select()
      .single() as unknown as { data: Resource | null; error: unknown };

    if (updateError) {
      console.error('Resource update error:', updateError);
      return serverErrorResponse();
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Admin resource PUT error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { resourceId } = await params;
    const supabase = createAdminClient();

    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (deleteError) {
      console.error('Resource delete error:', deleteError);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin resource DELETE error:', error);
    return serverErrorResponse();
  }
}
