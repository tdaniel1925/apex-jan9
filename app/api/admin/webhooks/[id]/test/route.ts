/**
 * Admin Webhook Test API
 * POST - Test a webhook endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { testWebhook } from '@/lib/services/webhook-service';

interface WebhookEndpoint {
  id: string;
  url: string;
  secret_key: string | null;
  headers: Record<string, string>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get webhook
    const { data: webhookData, error } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret_key, headers')
      .eq('id', id)
      .single();

    if (error || !webhookData) {
      return notFoundResponse('Webhook not found');
    }

    const webhook = webhookData as unknown as WebhookEndpoint;

    // Test the webhook
    const result = await testWebhook({
      url: webhook.url,
      secret_key: webhook.secret_key || undefined,
      headers: webhook.headers,
    });

    return NextResponse.json({
      success: result.success,
      statusCode: result.statusCode,
      error: result.error,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return serverErrorResponse();
  }
}
