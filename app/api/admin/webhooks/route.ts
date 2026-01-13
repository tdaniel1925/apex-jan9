/**
 * Admin Webhooks API
 * GET - List all webhook endpoints
 * POST - Create a new webhook endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { WEBHOOK_EVENTS, testWebhook } from '@/lib/services/webhook-service';

// Type definitions
interface WebhookEndpoint {
  id: string;
  name: string;
  description: string | null;
  url: string;
  secret_key: string | null;
  is_active: boolean;
  events: string[];
  headers: Record<string, string>;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

// Create webhook schema
const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  url: z.string().url('Valid URL is required'),
  secret_key: z.string().optional(),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  headers: z.record(z.string(), z.string()).optional(),
  retry_count: z.number().min(0).max(5).optional(),
  timeout_seconds: z.number().min(5).max(60).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Webhooks fetch error:', error);
      return serverErrorResponse();
    }

    const webhooks = (data || []) as unknown as WebhookEndpoint[];

    // Get available events for the frontend
    return NextResponse.json({
      webhooks,
      availableEvents: WEBHOOK_EVENTS,
    });
  } catch (error) {
    console.error('Webhooks GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const webhookData = parseResult.data;

    // Validate events
    const validEventValues = WEBHOOK_EVENTS.map((e) => e.value);
    const invalidEvents = webhookData.events.filter((e) => !validEventValues.includes(e as never));
    if (invalidEvents.length > 0) {
      return badRequestResponse(`Invalid events: ${invalidEvents.join(', ')}`);
    }

    // Create webhook
    const { data: webhook, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        name: webhookData.name,
        description: webhookData.description || null,
        url: webhookData.url,
        secret_key: webhookData.secret_key || null,
        events: webhookData.events,
        headers: webhookData.headers || {},
        retry_count: webhookData.retry_count ?? 3,
        timeout_seconds: webhookData.timeout_seconds ?? 30,
        is_active: webhookData.is_active ?? true,
        created_by: admin.agentId,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Webhook create error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Webhooks POST error:', error);
    return serverErrorResponse();
  }
}
