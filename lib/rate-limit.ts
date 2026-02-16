// SPEC: SPEC-DEPENDENCY-MAP > CROSS-CUTTING > Rate Limiting
// In-memory rate limiting for API endpoints and forms

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Unique identifier for this rate limit (e.g., IP address, user ID)
   */
  identifier: string;

  /**
   * Optional namespace to separate different rate limits
   */
  namespace?: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Number of requests remaining in the current window
   */
  remaining: number;

  /**
   * Timestamp when the rate limit resets
   */
  resetAt: number;
}

/**
 * Check and update rate limit for a request
 *
 * @example
 * const result = await rateLimit({
 *   maxRequests: 3,
 *   windowSeconds: 3600, // 1 hour
 *   identifier: ipAddress,
 *   namespace: 'contact-form'
 * });
 *
 * if (!result.allowed) {
 *   return { error: 'Rate limit exceeded' };
 * }
 */
export async function rateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds, identifier, namespace } = options;

  // Create unique key
  const key = namespace ? `${namespace}:${identifier}` : identifier;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Get or create entry
  let entry = rateLimitStore.get(key);

  // If no entry or expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimits = {
  /**
   * Contact form: 3 submissions per hour per IP
   */
  CONTACT_FORM: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    namespace: "contact-form",
  },

  /**
   * Username check: 20 requests per minute per IP
   */
  USERNAME_CHECK: {
    maxRequests: 20,
    windowSeconds: 60, // 1 minute
    namespace: "username-check",
  },

  /**
   * Sign-up: 5 per hour per IP
   */
  SIGNUP: {
    maxRequests: 5,
    windowSeconds: 3600, // 1 hour
    namespace: "signup",
  },
} as const;

/**
 * Helper to get IP address from request headers
 *
 * SECURITY NOTE: This relies on trusted proxy headers set by Vercel/Cloudflare.
 * These headers cannot be spoofed when using these platforms. In other
 * environments, ensure you have a trusted reverse proxy that sets these headers.
 */
export function getClientIp(headers: Headers): string {
  // On Vercel/Cloudflare, x-forwarded-for is set by the platform (trusted)
  // Take the first IP in the chain (client IP), not the last (proxy IP)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Alternative header used by some proxies
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback (shouldn't happen in production on Vercel/Cloudflare)
  return "unknown";
}
