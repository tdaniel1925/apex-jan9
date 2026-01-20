/**
 * Request Tracing Utility
 * Phase 2 - Issue #36: Request ID tracing for distributed debugging
 *
 * Note: Next.js middleware runs at /middleware.ts in the root
 * This file provides utilities for request tracing within API routes
 */

import { v4 as uuidv4 } from 'uuid';
import type { NextRequest } from 'next/server';

/**
 * Get or generate request ID
 */
export function getRequestId(request: NextRequest | Request): string {
  const existingId = request.headers.get('x-request-id');
  return existingId || uuidv4();
}

/**
 * Add request ID to headers
 */
export function addRequestIdHeader(headers: Headers, requestId?: string): void {
  const id = requestId || uuidv4();
  headers.set('x-request-id', id);
  headers.set('x-request-time', new Date().toISOString());
}
