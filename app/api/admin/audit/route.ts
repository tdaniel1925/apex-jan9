/**
 * Admin Audit Log API
 * GET /api/admin/audit - View audit log entries
 */

import { NextRequest } from 'next/server';
import { getAuditLog } from '@/lib/auth/admin-rbac';
import { requireAdminPermission } from '@/lib/auth/admin-middleware';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdminPermission(request, 'audit.view');
    if (error) return error;

    // Get query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || undefined;
    const resourceType = searchParams.get('resource_type') || undefined;
    const resourceId = searchParams.get('resource_id') || undefined;
    const action = searchParams.get('action') as 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { entries, total } = await getAuditLog({
      userId,
      resourceType,
      resourceId,
      action,
      limit: Math.min(limit, 100), // Max 100 per page
      offset,
    });

    return apiSuccess({
      entries: entries.map((e) => ({
        id: e.id,
        user: e.user
          ? {
              id: e.user.id,
              email: e.user.email,
              first_name: e.user.first_name,
              last_name: e.user.last_name,
            }
          : null,
        action: e.action,
        resource_type: e.resource_type,
        resource_id: e.resource_id,
        old_values: e.old_values,
        new_values: e.new_values,
        ip_address: e.ip_address,
        created_at: e.created_at,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    return ApiErrors.internal();
  }
}
