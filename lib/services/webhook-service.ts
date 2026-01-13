/**
 * Webhook Service
 * Handles triggering webhooks for Zapier and other integrations
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import crypto from 'crypto';

// Available webhook event types
export type WebhookEventType =
  | 'agent.created'
  | 'agent.activated'
  | 'agent.rank_changed'
  | 'commission.created'
  | 'commission.paid'
  | 'policy.submitted'
  | 'policy.approved'
  | 'lead.created'
  | 'lead.converted'
  | 'withdrawal.requested'
  | 'withdrawal.approved'
  | 'withdrawal.paid'
  | 'bonus.awarded'
  | 'training.completed';

export const WEBHOOK_EVENTS: { value: WebhookEventType; label: string; description: string }[] = [
  { value: 'agent.created', label: 'Agent Created', description: 'New agent signs up' },
  { value: 'agent.activated', label: 'Agent Activated', description: 'Agent status changed to active' },
  { value: 'agent.rank_changed', label: 'Rank Changed', description: 'Agent rank promotion/demotion' },
  { value: 'commission.created', label: 'Commission Created', description: 'New commission recorded' },
  { value: 'commission.paid', label: 'Commission Paid', description: 'Commission marked as paid' },
  { value: 'policy.submitted', label: 'Policy Submitted', description: 'New policy submitted' },
  { value: 'policy.approved', label: 'Policy Approved', description: 'Policy approved' },
  { value: 'lead.created', label: 'Lead Created', description: 'New lead created in CRM' },
  { value: 'lead.converted', label: 'Lead Converted', description: 'Lead converted to client' },
  { value: 'withdrawal.requested', label: 'Withdrawal Requested', description: 'Agent requested withdrawal' },
  { value: 'withdrawal.approved', label: 'Withdrawal Approved', description: 'Withdrawal approved' },
  { value: 'withdrawal.paid', label: 'Withdrawal Paid', description: 'Withdrawal processed' },
  { value: 'bonus.awarded', label: 'Bonus Awarded', description: 'Bonus awarded to agent' },
  { value: 'training.completed', label: 'Training Completed', description: 'Agent completed course/track' },
];

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret_key: string | null;
  events: string[];
  headers: Record<string, string>;
  retry_count: number;
  timeout_seconds: number;
  is_active: boolean;
}

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(
  event: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  // Get all active endpoints subscribed to this event
  const { data: endpoints, error } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('is_active', true)
    .contains('events', [event]);

  if (error) {
    console.error('Failed to fetch webhook endpoints:', error);
    return;
  }

  if (!endpoints || endpoints.length === 0) {
    return;
  }

  const typedEndpoints = endpoints as unknown as WebhookEndpoint[];

  // Prepare payload
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Trigger all matching webhooks in parallel
  await Promise.allSettled(
    typedEndpoints.map((endpoint) => deliverWebhook(endpoint, payload))
  );
}

/**
 * Deliver a webhook to a single endpoint
 */
async function deliverWebhook(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload,
  attemptNumber = 1
): Promise<void> {
  const supabase = createAdminClient();
  const startTime = Date.now();
  const payloadString = JSON.stringify(payload);

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Apex-Webhook/1.0',
    'X-Webhook-Event': payload.event,
    'X-Webhook-Timestamp': payload.timestamp,
    ...endpoint.headers,
  };

  // Add signature if secret key is set
  if (endpoint.secret_key) {
    headers['X-Webhook-Signature'] = generateSignature(payloadString, endpoint.secret_key);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), endpoint.timeout_seconds * 1000);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const duration = Date.now() - startTime;
    let responseBody = '';

    try {
      responseBody = await response.text();
    } catch {
      // Ignore response body errors
    }

    const success = response.ok;

    // Log the attempt
    await supabase.from('webhook_logs').insert({
      endpoint_id: endpoint.id,
      event_type: payload.event,
      payload: payload as unknown,
      status_code: response.status,
      response_body: responseBody.substring(0, 1000), // Limit response body size
      duration_ms: duration,
      success,
      attempt_number: attemptNumber,
    } as never);

    // Update endpoint stats
    if (success) {
      await supabase
        .from('webhook_endpoints')
        .update({
          last_triggered_at: new Date().toISOString(),
          success_count: endpoint.id, // Will use SQL increment
        } as never)
        .eq('id', endpoint.id);

      // Increment success count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('increment_webhook_success', { endpoint_id: endpoint.id });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('increment_webhook_failure', { endpoint_id: endpoint.id });

      // Retry if not successful and attempts remaining
      if (attemptNumber < endpoint.retry_count) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attemptNumber - 1) * 1000;
        setTimeout(() => {
          deliverWebhook(endpoint, payload, attemptNumber + 1);
        }, delay);
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log the failure
    await supabase.from('webhook_logs').insert({
      endpoint_id: endpoint.id,
      event_type: payload.event,
      payload: payload as unknown,
      duration_ms: duration,
      success: false,
      error_message: errorMessage,
      attempt_number: attemptNumber,
    } as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('increment_webhook_failure', { endpoint_id: endpoint.id });

    // Retry if attempts remaining
    if (attemptNumber < endpoint.retry_count) {
      const delay = Math.pow(2, attemptNumber - 1) * 1000;
      setTimeout(() => {
        deliverWebhook(endpoint, payload, attemptNumber + 1);
      }, delay);
    }
  }
}

/**
 * Test a webhook endpoint
 */
export async function testWebhook(endpoint: {
  url: string;
  secret_key?: string;
  headers?: Record<string, string>;
}): Promise<{ success: boolean; statusCode?: number; error?: string; duration: number }> {
  const startTime = Date.now();
  const payload: WebhookPayload = {
    event: 'agent.created' as WebhookEventType,
    timestamp: new Date().toISOString(),
    data: {
      test: true,
      message: 'This is a test webhook from Apex Affinity Group',
    },
  };

  const payloadString = JSON.stringify(payload);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Apex-Webhook/1.0',
    'X-Webhook-Event': 'test',
    'X-Webhook-Timestamp': payload.timestamp,
    ...endpoint.headers,
  };

  if (endpoint.secret_key) {
    headers['X-Webhook-Signature'] = generateSignature(payloadString, endpoint.secret_key);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout for tests

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const duration = Date.now() - startTime;

    return {
      success: response.ok,
      statusCode: response.status,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}
