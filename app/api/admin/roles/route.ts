/**
 * Admin Roles API
 * GET /api/admin/roles - List all roles with permissions
 */

import { NextRequest } from 'next/server';
import { listRoles, getRoleWithPermissions, listPermissions, logAdminAction } from '@/lib/auth/admin-rbac';
import { requireAdminPermission } from '@/lib/auth/admin-middleware';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdminPermission(request, 'roles.view');
    if (error) return error;

    // Get query param for detail view
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('role_id');
    const includePermissions = searchParams.get('include_permissions') === 'true';

    if (roleId) {
      // Get single role with permissions
      const role = await getRoleWithPermissions(roleId);
      if (!role) {
        return ApiErrors.notFound('Role');
      }

      return apiSuccess({ role });
    }

    // List all roles
    const roles = await listRoles();

    // Optionally include all permissions
    let permissions = null;
    if (includePermissions) {
      permissions = await listPermissions();
    }

    // Log view action
    await logAdminAction({
      userId: user!.id,
      action: 'view',
      resourceType: 'admin_roles',
    });

    return apiSuccess({
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        display_name: r.display_name,
        description: r.description,
        level: r.level,
        is_system: r.is_system,
      })),
      permissions: permissions?.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        description: p.description,
      })),
    });
  } catch (error) {
    console.error('Error listing roles:', error);
    return ApiErrors.internal();
  }
}
