'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminAuthProvider } from '@/components/admin/admin-auth-provider';
import { useAuth } from '@/lib/auth/auth-context';
import { Agent } from '@/lib/types/database';

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

const ADMIN_TOKEN_KEY = 'apex_admin_token';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { agent, loading: authLoading, agentLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [authType, setAuthType] = useState<'agent' | 'admin' | null>(null);

  // Check for magic link token in URL and store it
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      // Store the token from magic link
      localStorage.setItem(ADMIN_TOKEN_KEY, urlToken);
      // Clean the URL (remove token param)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [searchParams]);

  // Check for RBAC admin auth (corporate staff)
  useEffect(() => {
    const checkAdminAuth = async () => {
      // Check URL first for magic link token
      const urlToken = searchParams.get('token');
      const token = urlToken || localStorage.getItem(ADMIN_TOKEN_KEY);

      if (!token) {
        setAdminLoading(false);
        return;
      }

      // If we got token from URL, store it
      if (urlToken) {
        localStorage.setItem(ADMIN_TOKEN_KEY, urlToken);
      }

      try {
        const response = await fetch('/api/admin/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setAdminUser(data.data.user);
          setAuthType('admin');
        } else {
          // Invalid token, remove it
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        }
      } catch (error) {
        console.error('Admin auth check failed:', error);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminAuth();
  }, [searchParams]);

  // Check for agent rank-based auth
  useEffect(() => {
    if (!authLoading && !agentLoading && agent && !adminUser) {
      const agentRank = agent.rank as Rank;
      const isAdmin = RANK_CONFIG[agentRank]?.order >= RANK_CONFIG.regional_mga.order;

      if (isAdmin) {
        setAuthType('agent');
      }
    }
  }, [agent, authLoading, agentLoading, adminUser]);

  // Redirect if neither auth is valid
  useEffect(() => {
    if (!adminLoading && !authLoading && !agentLoading) {
      if (!adminUser && !agent) {
        // No auth at all, redirect to login
        router.push('/admin-login');
        return;
      }

      if (!adminUser && agent) {
        // Has agent auth, check rank
        const agentRank = agent.rank as Rank;
        const isAdmin = RANK_CONFIG[agentRank]?.order >= RANK_CONFIG.regional_mga.order;

        if (!isAdmin) {
          router.push('/dashboard');
        }
      }
    }
  }, [adminLoading, authLoading, agentLoading, adminUser, agent, router]);

  // Show loading while checking auth
  if (adminLoading || authLoading || agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No valid auth
  if (!adminUser && !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Create a display user object for the sidebar/header
  // If using admin RBAC, create a fake agent object with admin info
  const displayUser: Agent | null = adminUser
    ? ({
        id: adminUser.id,
        user_id: adminUser.id,
        sponsor_id: null,
        agent_code: 'ADMIN',
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        email: adminUser.email,
        phone: null,
        avatar_url: null,
        bio: null,
        calendar_link: null,
        rank: 'ceo' as Rank, // Admin users show as CEO for display purposes
        status: 'active' as const,
        licensed_date: null,
        premium_90_days: 0,
        persistency_rate: 100,
        placement_rate: 100,
        active_agents_count: 0,
        personal_recruits_count: 0,
        mgas_in_downline: 0,
        personal_bonus_volume: 0,
        organization_bonus_volume: 0,
        pbv_90_days: 0,
        obv_90_days: 0,
        ai_copilot_tier: 'none' as const,
        ai_copilot_subscribed_at: null,
        username: adminUser.email.split('@')[0],
        replicated_site_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fast_start_ends_at: new Date().toISOString(),
      } as Agent)
    : agent;

  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-background">
        <AdminSidebar agent={displayUser!} adminUser={adminUser} />
        <div className="lg:pl-64">
          <AdminHeader agent={displayUser!} adminUser={adminUser} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AdminAuthProvider>
  );
}
