/**
 * Admin Webhook API
 * GET - Get single webhook with logs
 * PUT - Update webhook
 * DELETE - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { WEBHOOK_EVENTS } from '@/lib/services/webhook-service';

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

interface WebhookLog {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: unknown;
  status_code: number | null;
  response_body: string | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  attempt_number: number;
  triggered_at: string;
}

// Update webhook schema
const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  url: z.string().url().optional(),
  secret_key: z.string().optional().nullable(),
  events: z.array(z.string()).min(1).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retry_count: z.number().min(0).max(5).optional(),
  timeout_seconds: z.number().min(5).max(60).optional(),
  is_active: z.boolean().optional(),
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

    // Get webhook
    const { data: webhookData, error: webhookError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', id)
      .single();

    if (webhookError || !webhookData) {
      return notFoundResponse('Webhook not found');
    }

    const webhook = webhookData as unknown as WebhookEndpoint;

    // Get recent logs
    const { data: logsData } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('endpoint_id', id)
      .order('triggered_at', { ascending: false })
      .limit(50);

    const logs = (logsData || []) as unknown as WebhookLog[];

    return NextResponse.json({
      webhook,
      logs,
    });
  } catch (error) {
    console.error('Webhook GET error:', error);
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
    const parseResult = updateWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    // Check if webhook exists
    const { data: existingData, error: fetchError } = await supabase
      .from('webhook_endpoints')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      return notFoundResponse('Webhook not found');
    }

    const updateData = parseResult.data;

    // Validate events if provided
    if (updateData.events) {
      const validEventValues = WEBHOOK_EVENTS.map((e) => e.value);
      const invalidEvents = updateData.events.filter((e) => !validEventValues.includes(e as never));
      if (invalidEvents.length > 0) {
        return badRequestResponse(`Invalid events: ${invalidEvents.join(', ')}`);
      }
    }

    // Update webhook
    const { data: webhook, error: updateError } = await supabase
      .from('webhook_endpoints')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Webhook update error:', updateError);
      return serverErrorResponse();
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Webhook PUT error:', error);
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

    // Check if webhook exists
    const { data: existingData, error: fetchError } = await supabase
      .from('webhook_endpoints')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      return notFoundResponse('Webhook not found');
    }

    const existing = existingData as unknown as { id: string; name: string };

    // Delete webhook (logs will cascade)
    const { error: deleteError } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Webhook delete error:', deleteError);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true, message: `Webhook "${existing.name}" deleted` });
  } catch (error) {
    console.error('Webhook DELETE error:', error);
    return serverErrorResponse();
  }
}
