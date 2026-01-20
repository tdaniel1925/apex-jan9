/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 *
 * Phase 2 Security Enhancement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';

export interface RateLimitConfig {
  requests: number; // Max requests
  window: string; // Time window: '1m', '15m', '1h', '1d'
  identifier?: 'ip' | 'user' | 'agent'; // What to rate limit by
}

// Rate limit configurations by endpoint pattern
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Admin authentication (very strict)
  'admin_login': { requests: 5, window: '15m', identifier: 'ip' },

  // Admin mutations (strict)
  'admin_mutations': { requests: 100, window: '1h', identifier: 'user' },

  // Admin queries (moderate)
  'admin_queries': { requests: 500, window: '1h', identifier: 'user' },

  // Agent authentication
  'agent_login': { requests: 10, window: '15m', identifier: 'ip' },

  // Agent mutations (moderate)
  'agent_mutations': { requests: 200, window: '1h', identifier: 'agent' },

  // AI chat (very strict - expensive)
  'ai_chat': { requests: 20, window: '1m', identifier: 'agent' },

  // Public API (lenient)
  'public_api': { requests: 1000, window: '1h', identifier: 'ip' },

  // Webhooks (lenient - legitimate traffic)
  'webhooks': { requests: 5000, window: '1h', identifier: 'ip' },

  // File uploads (moderate)
  'file_upload': { requests: 50, window: '1h', identifier: 'agent' },

  // Email operations
  'email_send': { requests: 100, window: '1h', identifier: 'agent' },

  // Commission import (very strict)
  'commission_import': { requests: 10, window: '1h', identifier: 'user' },

  // Training progress (moderate)
  'training_progress': { requests: 500, window: '1h', identifier: 'agent' },
};

/**
 * Parse time window to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(m|h|d)$/);
  if (!match) throw new Error(`Invalid window format: ${window}`);

  const [, amount, unit] = match;
  const value = parseInt(amount, 10);

  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Invalid time unit: ${unit}`);
  }
}

/**
 * Get identifier for rate limiting
 */
async function getIdentifier(
  request: NextRequest,
  type: 'ip' | 'user' | 'agent' = 'ip'
): Promise<string> {
  if (type === 'ip') {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    return forwarded?.split(',')[0]?.trim() || real || 'unknown';
  }

  if (type === 'user' || type === 'agent') {
    // Extract from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return 'anonymous';

    // For now, use a hash of the token as identifier
    // In production, decode JWT and use user/agent ID
    return `auth_${Buffer.from(authHeader).toString('base64').substring(0, 20)}`;
  }

  return 'unknown';
}

/**
 * Check rate limit and record request
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}> {
  const supabase = createAdminClient();
  const identifier = await getIdentifier(request, config.identifier);
  const windowMs = parseWindow(config.window);
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const key = `${identifier}:${request.nextUrl.pathname}`;

  try {
    // Get recent requests within window
    const { data: recentRequests, error } = await supabase
      .from('rate_limit_requests')
      .select('id, created_at')
      .eq('key', key)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limit check fails
      return {
        allowed: true,
        remaining: config.requests,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    const typedRequests = recentRequests as { id: string; created_at: string }[] | null;
    const requestCount = typedRequests?.length || 0;
    const remaining = Math.max(0, config.requests - requestCount);
    const resetAt = typedRequests?.[0]
      ? new Date(new Date(typedRequests[0].created_at).getTime() + windowMs)
      : new Date(now.getTime() + windowMs);

    // Check if limit exceeded
    if (requestCount >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        error: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`,
      };
    }

    // Record this request
    await supabase.from('rate_limit_requests').insert({
      key,
      identifier,
      path: request.nextUrl.pathname,
      method: request.method,
      created_at: now.toISOString(),
    } as never);

    // Clean up old requests (async, don't wait)
    void supabase
      .from('rate_limit_requests')
      .delete()
      .lt('created_at', windowStart.toISOString())
      .then(() => {
        // Cleanup complete
      });

    return {
      allowed: true,
      remaining: remaining - 1, // Subtract the current request
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }
}

/**
 * Rate limit middleware factory
 */
export function rateLimitMiddleware(
  configKey: keyof typeof RATE_LIMITS
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const config = RATE_LIMITS[configKey];

    if (!config) {
      console.warn(`No rate limit config found for: ${configKey}`);
      return null; // Continue without rate limiting
    }

    const result = await checkRateLimit(request, config);

    // Add rate limit headers to all responses
    const headers = {
      'X-RateLimit-Limit': config.requests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
    };

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: result.error,
          resetAt: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Allow request to continue (return null)
    // Note: We'll need to add headers in the actual route handler
    return null;
  };
}

/**
 * Helper to apply rate limiting in route handlers
 */
export async function applyRateLimit(
  request: NextRequest,
  configKey: keyof typeof RATE_LIMITS
): Promise<{ allowed: true } | NextResponse> {
  const middleware = rateLimitMiddleware(configKey);
  const response = await middleware(request);

  if (response) {
    return response; // Rate limit exceeded
  }

  return { allowed: true };
}

/**
 * Determine rate limit config key from request path
 */
export function getRateLimitKey(path: string, method: string): keyof typeof RATE_LIMITS {
  // Admin routes
  if (path.startsWith('/api/admin/auth/login')) return 'admin_login';
  if (path.startsWith('/api/admin/commissions/import')) return 'commission_import';
  if (path.startsWith('/api/admin/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return 'admin_mutations';
  }
  if (path.startsWith('/api/admin/')) return 'admin_queries';

  // Agent authentication
  if (path.startsWith('/api/auth/login')) return 'agent_login';

  // AI chat
  if (path.startsWith('/api/ai/chat')) return 'ai_chat';

  // Webhooks
  if (path.startsWith('/api/webhooks/')) return 'webhooks';

  // File uploads
  if (path.startsWith('/api/upload/')) return 'file_upload';

  // Email
  if (path.includes('/email/')) return 'email_send';

  // Training
  if (path.startsWith('/api/training/progress')) return 'training_progress';

  // Agent mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return 'agent_mutations';
  }

  // Default: public API
  return 'public_api';
}
