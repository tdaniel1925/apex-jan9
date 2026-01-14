import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import { ReplicatedSiteHeader } from '@/components/replicated/header';
import { ReplicatedSiteFooter } from '@/components/replicated/footer';
import type { Agent } from '@/lib/types/database';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

  const { data: agentData } = await supabase
    .from('agents')
    .select('first_name, last_name, avatar_url, bio, username')
    .eq('username', username.toLowerCase())
    .single();

  if (!agentData) {
    return { title: 'Agent Not Found - Apex Affinity Group' };
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name' | 'avatar_url' | 'bio' | 'username'>;
  const agentName = `${agent.first_name} ${agent.last_name}`;
  const pageUrl = `${appUrl}/team/${agent.username}`;
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

export default async function TeamSiteLayout({ children, params }: LayoutProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch agent by username
  const { data: agentData, error } = await supabase
    .from('agents')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Agent;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ReplicatedSiteHeader agent={agent} agentCode={agent.username} basePath="team" />
      <main className="flex-1">
        {children}
      </main>
      <ReplicatedSiteFooter agent={agent} agentCode={agent.username} basePath="team" />
    </div>
  );
}
