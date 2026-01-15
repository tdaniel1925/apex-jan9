import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RANK_CONFIG } from '@/lib/config/ranks';
import {
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Car,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import type { Agent } from '@/lib/types/database';

const IMAGES = {
  careerGrowth: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80',
  training: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
};

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function OpportunityPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations('replicated.opportunity');

  const { data: agentData, error } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name'>;
  const agentName = `${agent.first_name} ${agent.last_name}`;
  const ranks = Object.values(RANK_CONFIG).slice(0, 8); // Show first 8 ranks

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.careerGrowth}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Income Streams */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('incomeStreams.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('incomeStreams.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('incomeStreams.personalCommissions.title')}</CardTitle>
                <CardDescription>{t('incomeStreams.personalCommissions.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('incomeStreams.personalCommissions.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('incomeStreams.overrideIncome.title')}</CardTitle>
                <CardDescription>{t('incomeStreams.overrideIncome.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('incomeStreams.overrideIncome.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('incomeStreams.fastStartBonus.title')}</CardTitle>
                <CardDescription>{t('incomeStreams.fastStartBonus.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('incomeStreams.fastStartBonus.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('incomeStreams.rankAdvancementBonus.title')}</CardTitle>
                <CardDescription>{t('incomeStreams.rankAdvancementBonus.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('incomeStreams.rankAdvancementBonus.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('incomeStreams.matchingBonus.title')}</CardTitle>
                <CardDescription>{t('incomeStreams.matchingBonus.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('incomeStreams.matchingBonus.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('incomeStreams.carBonus.title')}</CardTitle>
                <CardDescription>{t('incomeStreams.carBonus.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('incomeStreams.carBonus.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Career Path */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('careerPath.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('careerPath.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ranks.map((rank, index) => (
              <Card key={rank.name} className={index === 0 ? 'border-primary' : ''}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {rank.shortName}
                    </div>
                    <p className="text-sm font-medium mb-3">{rank.name}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{t('careerPath.premium90Days')}: ${rank.requirements.premium90Days.toLocaleString()}+</p>
                      <p>{t('careerPath.personalRecruits')}: {rank.requirements.personalRecruits}+</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('careerPath.additionalRanks')}
          </p>
        </div>
      </section>

      {/* Training & Support */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">{t('training.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t('training.subtitle')}
              </p>
              <ul className="space-y-3">
                {[
                  t('training.items.onboarding'),
                  t('training.items.productTraining'),
                  t('training.items.salesSkills'),
                  t('training.items.weeklyCalls'),
                  t('training.items.mentorship'),
                  t('training.items.marketing'),
                  t('training.items.aiCrm'),
                  t('training.items.dashboard'),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              {/* Training Image */}
              <div className="relative h-[250px] rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={IMAGES.training}
                  alt="Professional training session"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-primary text-primary-foreground rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">{t('rightForYou.title')}</h3>
              <p className="mb-6 text-primary-foreground/90">
                {t('rightForYou.subtitle')}
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  {t('rightForYou.items.motivated')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  {t('rightForYou.items.unlimitedIncome')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  {t('rightForYou.items.willingToLearn')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  {t('rightForYou.items.helpingOthers')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  {t('rightForYou.items.buildBusiness')}
                </li>
              </ul>
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/team/${username}/signup`}>
                  {t('rightForYou.applyNow')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('faq.title')}</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: t('faq.questions.licensed.q'),
                a: t('faq.questions.licensed.a'),
              },
              {
                q: t('faq.questions.cost.q'),
                a: t('faq.questions.cost.a'),
              },
              {
                q: t('faq.questions.pyramid.q'),
                a: t('faq.questions.pyramid.a'),
              },
              {
                q: t('faq.questions.earnings.q'),
                a: t('faq.questions.earnings.a'),
              },
              {
                q: t('faq.questions.leads.q'),
                a: t('faq.questions.leads.a'),
              },
            ].map((faq) => (
              <Card key={faq.q}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('cta.subtitle', { agentName })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href={`/team/${username}/signup`}>
                {t('cta.applyNow')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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
