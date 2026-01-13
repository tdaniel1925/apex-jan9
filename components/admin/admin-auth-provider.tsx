'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AdminRole {
  id: string;
  name: string;
  display_name: string;
  level: 'super_admin' | 'department_head' | 'staff';
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  roles: AdminRole[];
  permissions: string[];
}

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  isSuperAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const STORAGE_KEY = 'apex_admin_token';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken) {
      verifySession(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifySession = async (sessionToken: string) => {
    try {
      const response = await fetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (!response.ok) {
        // Invalid session, clear it
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.data.user);
      setToken(sessionToken);
    } catch (err) {
      console.error('Session verification failed:', err);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return false;
      }

      // Save token and user
      localStorage.setItem(STORAGE_KEY, data.data.token);
      setToken(data.data.token);
      setUser(data.data.user);

      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      router.push('/admin-login');
    }
  }, [token, router]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // Super admins have all permissions
      if (user.roles.some((r) => r.level === 'super_admin')) {
        return true;
      }

      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!user) return false;

      if (user.roles.some((r) => r.level === 'super_admin')) {
        return true;
      }

      return permissions.some((p) => user.permissions.includes(p));
    },
    [user]
  );

  const isSuperAdmin = user?.roles.some((r) => r.level === 'super_admin') ?? false;

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        isSuperAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// HOC for protecting admin pages by permission
export function withAdminPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission, loading, user } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/admin-login');
      } else if (!loading && user && !hasPermission(requiredPermission)) {
        router.push('/admin/unauthorized');
      }
    }, [loading, user, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user || !hasPermission(requiredPermission)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
