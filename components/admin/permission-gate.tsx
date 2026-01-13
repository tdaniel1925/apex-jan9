'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldX } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: Array<{
    id: string;
    name: string;
    display_name: string;
    level: 'super_admin' | 'department_head' | 'staff';
  }>;
  permissions: string[];
}

interface PermissionGateProps {
  children: ReactNode;
  /** Single permission required to access the content */
  permission?: string;
  /** Array of permissions - user must have ANY of these */
  anyOf?: string[];
  /** Array of permissions - user must have ALL of these */
  allOf?: string[];
  /** Custom fallback component when user lacks permission */
  fallback?: ReactNode;
  /** Whether to redirect to unauthorized page instead of showing fallback */
  redirectOnDeny?: boolean;
}

const STORAGE_KEY = 'apex_admin_token';

/**
 * PermissionGate - Conditionally renders children based on admin permissions
 *
 * Usage:
 * ```tsx
 * <PermissionGate permission="users.manage">
 *   <DeleteUserButton />
 * </PermissionGate>
 *
 * <PermissionGate anyOf={["finance.view", "analytics.view"]}>
 *   <FinanceWidget />
 * </PermissionGate>
 *
 * <PermissionGate allOf={["users.view", "users.manage"]} redirectOnDeny>
 *   <UserManagementPage />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
  redirectOnDeny = false,
}: PermissionGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const token = localStorage.getItem(STORAGE_KEY);

      if (!token) {
        setLoading(false);
        if (redirectOnDeny) {
          router.push('/admin-login');
        }
        return;
      }

      try {
        const response = await fetch('/api/admin/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          if (redirectOnDeny) {
            router.push('/admin-login');
          }
          return;
        }

        const data = await response.json();
        const adminUser = data.data.user as AdminUser;
        setUser(adminUser);

        // Check if user has permission
        const isSuperAdmin = adminUser.roles.some((r) => r.level === 'super_admin');

        if (isSuperAdmin) {
          setHasAccess(true);
        } else {
          let granted = false;

          if (permission) {
            granted = adminUser.permissions.includes(permission);
          } else if (anyOf && anyOf.length > 0) {
            granted = anyOf.some((p) => adminUser.permissions.includes(p));
          } else if (allOf && allOf.length > 0) {
            granted = allOf.every((p) => adminUser.permissions.includes(p));
          } else {
            // No permission specified, grant access
            granted = true;
          }

          setHasAccess(granted);

          if (!granted && redirectOnDeny) {
            router.push('/admin/unauthorized');
          }
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        if (redirectOnDeny) {
          router.push('/admin-login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permission, anyOf, allOf, redirectOnDeny, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * useAdminPermission - Hook to check admin permissions
 *
 * Usage:
 * ```tsx
 * const { hasPermission, hasAnyPermission, isSuperAdmin, loading } = useAdminPermission();
 *
 * if (hasPermission('users.manage')) {
 *   // Show admin UI
 * }
 * ```
 */
export function useAdminPermission() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem(STORAGE_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const isSuperAdmin = user?.roles.some((r) => r.level === 'super_admin') ?? false;

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return permissions.some((p) => user.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return permissions.every((p) => user.permissions.includes(p));
  };

  return {
    user,
    loading,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * RequirePermission - Wrapper component that redirects if permission is missing
 *
 * Use this for page-level protection where you want to redirect unauthorized users.
 *
 * Usage:
 * ```tsx
 * export default function UsersPage() {
 *   return (
 *     <RequirePermission permission="users.view">
 *       <UsersPageContent />
 *     </RequirePermission>
 *   );
 * }
 * ```
 */
export function RequirePermission({
  children,
  permission,
  anyOf,
  allOf,
}: Omit<PermissionGateProps, 'fallback' | 'redirectOnDeny'>) {
  return (
    <PermissionGate
      permission={permission}
      anyOf={anyOf}
      allOf={allOf}
      redirectOnDeny
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Permission constants for easy reference
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Agents
  AGENTS_VIEW: 'agents.view',
  AGENTS_EDIT: 'agents.edit',
  AGENTS_CREATE: 'agents.create',
  AGENTS_DELETE: 'agents.delete',

  // Finance
  COMMISSIONS_VIEW: 'commissions.view',
  COMMISSIONS_IMPORT: 'commissions.import',
  COMMISSIONS_EDIT: 'commissions.edit',
  PAYOUTS_VIEW: 'payouts.view',
  PAYOUTS_PROCESS: 'payouts.process',
  CLAWBACKS_VIEW: 'clawbacks.view',
  CLAWBACKS_MANAGE: 'clawbacks.manage',
  BONUSES_VIEW: 'bonuses.view',
  BONUSES_MANAGE: 'bonuses.manage',
  PAYPERIODS_VIEW: 'payperiods.view',
  PAYPERIODS_MANAGE: 'payperiods.manage',

  // Training
  TRAINING_VIEW: 'training.view',
  TRAINING_MANAGE: 'training.manage',
  CERTIFICATES_VIEW: 'certificates.view',
  CERTIFICATES_ISSUE: 'certificates.issue',

  // Compliance
  COMPLIANCE_VIEW: 'compliance.view',
  COMPLIANCE_MANAGE: 'compliance.manage',

  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  OVERRIDES_VIEW: 'overrides.view',

  // System
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SMARTOFFICE_VIEW: 'smartoffice.view',
  SMARTOFFICE_SYNC: 'smartoffice.sync',
  COPILOT_VIEW: 'copilot.view',
  COPILOT_MANAGE: 'copilot.manage',

  // Admin
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_VIEW: 'audit.view',
} as const;
