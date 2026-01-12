'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/lib/auth/auth-context';
import { CartProvider } from '@/lib/context/cart-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { agent, loading, agentLoading, refreshAgent } = useAuth();

  // Show loading while checking auth or fetching agent
  if (loading || agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If still no agent after auth loaded, show error
  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-destructive mb-4">Unable to load agent profile</p>
          <button
            onClick={() => refreshAgent()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Sidebar agent={agent} />
        <div className="lg:pl-64">
          <Header agent={agent} />
          <main className="p-6 bg-white">{children}</main>
        </div>
      </div>
    </CartProvider>
  );
}
