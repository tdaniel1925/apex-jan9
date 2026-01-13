/**
 * Admin Training Resources API
 * GET - List all resources
 * POST - Create a new resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { RESOURCE_TYPE_LABELS, RESOURCE_CATEGORY_LABELS } from '@/lib/types/training';
import type { Resource } from '@/lib/types/training';

interface ResourceCategoryRow { resource_category: string }

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
});

// Create resource schema
const createResourceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  resource_type: z.enum(['pdf', 'document', 'spreadsheet', 'video', 'audio', 'link', 'image']),
  resource_category: z.enum([
    'forms', 'scripts', 'presentations', 'guides',
    'carrier_materials', 'compliance', 'marketing', 'state_licensing'
  ]),
  file_url: z.string().url().optional(),
  file_size_bytes: z.number().int().min(0).optional(),
  external_url: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  is_downloadable: z.boolean().default(true),
  is_active: z.boolean().default(true),
  rank_requirement: z.string().optional(),
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

    const { limit, offset, category, type, search } = parseResult.data;

    // Build query
    let query = supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('resource_category', category);
    }

    if (type) {
      query = query.eq('resource_type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: resources, error, count } = await query as unknown as {
      data: Resource[] | null;
      error: unknown;
      count: number | null
    };

    if (error) {
      console.error('Resources fetch error:', error);
      return serverErrorResponse();
    }

    // Get stats by category
    const { data: allResources } = await supabase.from('resources').select('resource_category') as unknown as { data: ResourceCategoryRow[] | null };
    const categoryStats = new Map<string, number>();
    allResources?.forEach(r => {
      categoryStats.set(r.resource_category, (categoryStats.get(r.resource_category) || 0) + 1);
    });

    return NextResponse.json({
      resources: resources || [],
      total: count || 0,
      limit,
      offset,
      stats: Object.fromEntries(categoryStats),
      labels: {
        resourceTypes: RESOURCE_TYPE_LABELS,
        resourceCategories: RESOURCE_CATEGORY_LABELS,
      },
    });
  } catch (error) {
    console.error('Admin resources GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createResourceSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const resourceData = parseResult.data;

    const { data: resource, error: createError } = await supabase
      .from('resources')
      .insert({
        ...resourceData,
        tags: resourceData.tags || [],
      } as never)
      .select()
      .single() as unknown as { data: Resource | null; error: unknown };

    if (createError) {
      console.error('Resource create error:', createError);
      return serverErrorResponse();
    }

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error('Admin resources POST error:', error);
    return serverErrorResponse();
  }
}
