import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RANK_CONFIG } from '@/lib/config/ranks';
import type { Agent } from '@/lib/types/database';
import {
  Shield,
  TrendingUp,
  Users,
  Award,
  DollarSign,
  GraduationCap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

// High-quality stock images from Unsplash
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1920&q=80', // Professional team meeting
  success: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80', // Team celebrating
  family: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', // Happy family
};

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function TeamLandingPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations('replicated.home');
  const tMarketing = await getTranslations('marketing');

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
  const agentName = `${agent.first_name} ${agent.last_name}`;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.hero}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <p className="text-primary font-medium mb-2">{t('heroTitle')}</p>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  {t('heroSubtitle')}
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                {t('whyJoin.title', { agentName })}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href={`/team/${username}/signup`}>
                    {t('getQuote')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={`/team/${username}/opportunity`}>
                    {t('scheduleCall')}
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground">{tMarketing('stats.activeAgents')}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">$50M+</p>
                  <p className="text-sm text-muted-foreground">{tMarketing('stats.commissionsPaid')}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">7</p>
                  <p className="text-sm text-muted-foreground">{tMarketing('stats.aRatedCarriers')}</p>
                </div>
              </div>
            </div>

            {/* Agent Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={agent.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {agent.first_name[0]}{agent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {agent.first_name} {agent.last_name}
                      </h3>
                      <p className="text-muted-foreground">{rankConfig.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('cta.subtitle')}
                    </p>
                    <div className="pt-4 space-y-3">
                      <Button className="w-full" asChild>
                        <Link href={`/team/${username}/signup`}>{t('cta.button')}</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/team/${username}/contact`}>{t('scheduleCall')}</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('services.title')}</h2>
            <p className="text-muted-foreground">
              {t('whyJoin.personalService.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{tMarketing('whyApex.topCommissions.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tMarketing('whyApex.topCommissions.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{tMarketing('whyApex.teamBuilding.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tMarketing('whyApex.teamBuilding.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{tMarketing('whatYouGet.comprehensiveTraining.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tMarketing('whatYouGet.comprehensiveTraining.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{tMarketing('whyApex.topCarriers.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tMarketing('whyApex.topCarriers.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{tMarketing('whatYouGet.supportiveCommunity.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tMarketing('whatYouGet.supportiveCommunity.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{tMarketing('whyApex.aiCopilot.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tMarketing('whyApex.aiCopilot.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('howItWorks.title')}</h2>
            <p className="text-muted-foreground">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: t('howItWorks.step1'),
                description: t('howItWorks.step1Desc'),
              },
              {
                step: '2',
                title: t('howItWorks.step2'),
                description: t('howItWorks.step2Desc'),
              },
              {
                step: '3',
                title: t('howItWorks.step3'),
                description: t('howItWorks.step3Desc'),
              },
              {
                step: '4',
                title: t('howItWorks.step4'),
                description: t('howItWorks.step4Desc'),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Decorative background image */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 hidden lg:block">
          <Image
            src={IMAGES.success}
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">{t('whatYouGet.title')}</h2>
              <ul className="space-y-4">
                {[
                  t('whatYouGet.items.carriers'),
                  t('whatYouGet.items.training'),
                  t('whatYouGet.items.dashboard'),
                  t('whatYouGet.items.crm'),
                  t('whatYouGet.items.marketing'),
                  t('whatYouGet.items.calls'),
                  t('whatYouGet.items.fastStart'),
                  t('whatYouGet.items.advancement'),
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary-foreground/80 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-8 border border-primary-foreground/20">
                <p className="text-lg mb-4">{t('whatYouGet.readyToStart')}</p>
                <h3 className="text-2xl font-bold mb-6">
                  {t('whatYouGet.joinTeamToday', { agentName: agent.first_name })}
                </h3>
                <Button size="lg" variant="secondary" asChild>
                  <Link href={`/team/${username}/signup`}>
                    {t('whatYouGet.applyNow')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href={`/team/${username}/signup`}>{t('cta.joinNow')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/team/${username}/contact`}>{t('cta.askQuestions')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
