import { Metadata } from 'next';
import { createAdminClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import { ReplicatedSiteHeader } from '@/components/replicated/header';
import { ReplicatedSiteFooter } from '@/components/replicated/footer';
import type { Agent } from '@/lib/types/database';

// Public fields safe to expose on replicated sites
const PUBLIC_AGENT_FIELDS = 'id, first_name, last_name, username, agent_code, avatar_url, bio, rank, status' as const;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ agentCode: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ agentCode: string }> }): Promise<Metadata> {
  const { agentCode } = await params;
  const supabase = createAdminClient(); // Use admin client to bypass RLS for public pages
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

  const { data: agentData } = await supabase
    .from('agents')
    .select('first_name, last_name, avatar_url, bio')
    .eq('agent_code', agentCode)
    .in('status', ['active', 'pending']) // Only show active/pending agents
    .single();

  if (!agentData) {
    return { title: 'Agent Not Found - Apex Affinity Group' };
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name' | 'avatar_url' | 'bio'>;
  const agentName = `${agent.first_name} ${agent.last_name}`;
  const pageUrl = `${appUrl}/join/${agentCode}`;
  const title = `Join ${agentName}'s Team - Apex Affinity Group`;
  const description = agent.bio
    ? `${agent.bio.substring(0, 150)}...`
    : `Start your career in insurance with ${agentName} at Apex Affinity Group. Build your future with our proven system.`;

  // Use agent's avatar or fallback to default OG image
  const ogImage = agent.avatar_url || `${appUrl}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      'insurance career',
      'join Apex Affinity',
      'insurance agent opportunity',
      'MLM insurance',
      'financial services career',
      agentName,
    ],
    authors: [{ name: agentName }],
    openGraph: {
      type: 'website',
      url: pageUrl,
      title,
      description,
      siteName: 'Apex Affinity Group',
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Join ${agentName}'s Team at Apex Affinity Group`,
        },
      ] : undefined,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
      creator: '@TheApexWay',
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ReplicatedSiteLayout({ children, params }: LayoutProps) {
  const { agentCode } = await params;
  const supabase = createAdminClient(); // Use admin client to bypass RLS for public pages

  // Fetch agent by agent_code - only select public fields
  const { data: agentData, error } = await supabase
    .from('agents')
    .select(PUBLIC_AGENT_FIELDS)
    .eq('agent_code', agentCode)
    .in('status', ['active', 'pending']) // Only show active/pending agents
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Agent;

  // Note: Redirect from /join/[agentCode] to /team/[username] is handled in middleware
  // This layout only runs if agent doesn't have a username (legacy support)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ReplicatedSiteHeader agent={agent} agentCode={agentCode} />
      <main className="flex-1">
        {children}
      </main>
      <ReplicatedSiteFooter agent={agent} agentCode={agentCode} />
    </div>
  );
}
