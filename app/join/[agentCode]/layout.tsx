import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import { ReplicatedSiteHeader } from '@/components/replicated/header';
import { ReplicatedSiteFooter } from '@/components/replicated/footer';
import type { Agent } from '@/lib/types/database';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ agentCode: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ agentCode: string }> }) {
  const { agentCode } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('agent_code', agentCode)
    .single();

  if (!agentData) {
    return { title: 'Agent Not Found - Apex Affinity Group' };
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name'>;

  return {
    title: `Join ${agent.first_name} ${agent.last_name}'s Team - Apex Affinity Group`,
    description: `Start your career in insurance with ${agent.first_name} ${agent.last_name} at Apex Affinity Group. Build your future with our proven system.`,
  };
}

export default async function ReplicatedSiteLayout({ children, params }: LayoutProps) {
  const { agentCode } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch agent by agent_code
  const { data: agentData, error } = await supabase
    .from('agents')
    .select('*')
    .eq('agent_code', agentCode)
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Agent;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ReplicatedSiteHeader agent={agent} agentCode={agentCode} />
      <main className="flex-1">
        {children}
      </main>
      <ReplicatedSiteFooter agent={agent} />
    </div>
  );
}
