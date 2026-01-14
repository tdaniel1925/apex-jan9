import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RANK_CONFIG } from '@/lib/config/ranks';
import type { Agent } from '@/lib/types/database';
import {
  Mail,
  Phone,
  Award,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData } = await supabase
    .from('agents')
    .select('first_name, last_name, bio')
    .eq('username', username.toLowerCase())
    .single();

  if (!agentData) {
    return { title: 'Agent Not Found' };
  }

  const agent = agentData as { first_name: string; last_name: string; bio: string | null };

  return {
    title: `About ${agent.first_name} ${agent.last_name} | Apex Affinity Group`,
    description: agent.bio || `Learn more about ${agent.first_name} ${agent.last_name} and how they can help you start your insurance career with Apex Affinity Group.`,
  };
}

export default async function AboutMePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData, error } = await supabase
    .from('agents')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Agent;
  const rankConfig = RANK_CONFIG[agent.rank];

  // Calculate years with company (from created_at)
  const createdAt = new Date(agent.created_at);
  const now = new Date();
  const yearsWithCompany = Math.floor((now.getTime() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Agent Photo */}
              <div className="relative">
                <Avatar className="h-40 w-40 md:h-48 md:w-48 border-4 border-background shadow-xl">
                  <AvatarImage src={agent.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl md:text-5xl">
                    {agent.first_name[0]}{agent.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary">
                  {rankConfig.name}
                </Badge>
              </div>

              {/* Agent Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {agent.first_name} {agent.last_name}
                </h1>
                <p className="text-xl text-muted-foreground mb-4">
                  {rankConfig.name} at Apex Affinity Group
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {yearsWithCompany > 0 ? `${yearsWithCompany}+ years with Apex` : 'New Agent'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button asChild>
                    <Link href={`/team/${username}/signup`}>
                      Join My Team
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/team/${username}/contact`}>
                      Contact Me
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      {agent.bio && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">About Me</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="whitespace-pre-line">{agent.bio}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Card */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-6">Get In Touch</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Email</p>
                        <p className="text-sm">{agent.email}</p>
                      </div>
                    </a>

                    {agent.phone && (
                      <a
                        href={`tel:${agent.phone}`}
                        className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Phone</p>
                          <p className="text-sm">{agent.phone}</p>
                        </div>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-center md:justify-end">
                    <Button size="lg" asChild>
                      <Link href={`/team/${username}/contact`}>
                        Send a Message
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Work With Me */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">Why Work With Me?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Personal Mentorship</h3>
                  <p className="text-sm text-muted-foreground">
                    I&apos;ll personally guide you through every step of building your insurance business.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Proven Success</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn from someone who has walked the path and achieved real results.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Team Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Join a supportive team environment where everyone helps each other succeed.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">What You Get When You Join My Team</h2>
            <div className="space-y-4">
              {[
                'Access to 7 A-rated insurance carriers',
                'Comprehensive training and ongoing education',
                'AI-powered tools to grow your business',
                'Personal mentorship and support',
                'Competitive commissions up to 145%',
                'Full ownership of your book of business from day one',
                'Opportunity to build your own team',
                'No startup costs or monthly fees',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Let&apos;s talk about how I can help you build a successful career in insurance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href={`/team/${username}/signup`}>
                Join My Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href={`/team/${username}/contact`}>
                Ask Questions First
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
