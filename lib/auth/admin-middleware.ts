/**
 * Admin Middleware Helpers
 * Verify admin sessions and permissions in API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, hasPermission, AdminUserWithRoles } from './admin-rbac';
import { ApiErrors } from '@/lib/api/response';

/**
 * Extract admin token from request
 */
export function getAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

/**
 * Verify admin session and return user
 */
export async function requireAdminAuth(request: NextRequest): Promise<{
  user: AdminUserWithRoles | null;
  error: NextResponse | null;
}> {
  const token = getAdminToken(request);

  if (!token) {
    return { user: null, error: ApiErrors.unauthorized('No session token provided') };
  }

  const user = await verifyAdminSession(token);

  if (!user) {
    return { user: null, error: ApiErrors.unauthorized('Invalid or expired session') };
  }

  return { user, error: null };
}

/**
 * Verify admin session and check specific permission
 */
export async function requireAdminPermission(
  request: NextRequest,
  permission: string
): Promise<{
  user: AdminUserWithRoles | null;
  error: NextResponse | null;
}> {
  const { user, error } = await requireAdminAuth(request);

  if (error) {
    return { user: null, error };
  }

  if (!hasPermission(user!, permission)) {
    return {
      user: null,
      error: ApiErrors.forbidden(`Missing permission: ${permission}`),
    };
  }

  return { user, error: null };
}

/**
 * Verify admin session and check any of the specified permissions
 */
export async function requireAnyAdminPermission(
  request: NextRequest,
  permissions: string[]
): Promise<{
  user: AdminUserWithRoles | null;
  error: NextResponse | null;
}> {
  const { user, error } = await requireAdminAuth(request);

  if (error) {
    return { user: null, error };
  }

  const hasAny = permissions.some((p) => hasPermission(user!, p));

  if (!hasAny) {
    return {
      user: null,
      error: ApiErrors.forbidden(`Missing one of permissions: ${permissions.join(', ')}`),
    };
  }

  return { user, error: null };
}
