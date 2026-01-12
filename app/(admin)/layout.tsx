'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { agent, loading, agentLoading } = useAuth();

  useEffect(() => {
    // Only check admin privileges once agent is loaded
    if (!loading && !agentLoading && agent) {
      const agentRank = agent.rank as Rank;
      const isAdmin = RANK_CONFIG[agentRank]?.order >= RANK_CONFIG.regional_mga.order;

      if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [agent, loading, agentLoading, router]);

  if (loading || agentLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar agent={agent} />
      <div className="lg:pl-64">
        <AdminHeader agent={agent} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
