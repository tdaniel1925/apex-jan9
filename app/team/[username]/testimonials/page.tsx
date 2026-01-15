import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Quote, Star, ArrowRight } from 'lucide-react';
import type { Agent } from '@/lib/types/database';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function TestimonialsPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations('replicated.testimonials');

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

  const testimonials = [
    {
      key: 'michael',
      name: t('stories.michael.name'),
      role: t('stories.michael.role'),
      image: null,
      quote: t('stories.michael.quote'),
      years: 3,
    },
    {
      key: 'sarah',
      name: t('stories.sarah.name'),
      role: t('stories.sarah.role'),
      image: null,
      quote: t('stories.sarah.quote'),
      years: 2,
    },
    {
      key: 'david',
      name: t('stories.david.name'),
      role: t('stories.david.role'),
      image: null,
      quote: t('stories.david.quote'),
      years: 4,
    },
    {
      key: 'amanda',
      name: t('stories.amanda.name'),
      role: t('stories.amanda.role'),
      image: null,
      quote: t('stories.amanda.quote'),
      years: 1,
    },
    {
      key: 'robert',
      name: t('stories.robert.name'),
      role: t('stories.robert.role'),
      image: null,
      quote: t('stories.robert.quote'),
      years: 5,
    },
    {
      key: 'jennifer',
      name: t('stories.jennifer.name'),
      role: t('stories.jennifer.role'),
      image: null,
      quote: t('stories.jennifer.quote'),
      years: 1,
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Featured Testimonial */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground max-w-4xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <Quote className="h-12 w-12 mb-6 opacity-50" />
              <blockquote className="text-2xl font-medium mb-6">
                &ldquo;{t('featured.quote')}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{t('featured.name')}</p>
                  <p className="text-primary-foreground/80">{t('featured.role', { years: 3 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('grid.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.key} className="h-full">
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground flex-1 mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role} | {testimonial.years > 1 ? t('grid.yearsWithApexPlural', { years: testimonial.years }) : t('grid.yearsWithApex', { years: testimonial.years })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('stats.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('stats.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">$125K+</p>
              <p className="text-muted-foreground">{t('stats.avgIncome')}</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">94%</p>
              <p className="text-muted-foreground">{t('stats.satisfaction')}</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">48</p>
              <p className="text-muted-foreground">{t('stats.newMGAs')}</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">$2.5M</p>
              <p className="text-muted-foreground">{t('stats.bonuses')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Testimonials Placeholder */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('videos.title')}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('videos.subtitle')}
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-video bg-muted rounded-lg flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-primary ml-1" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('videos.comingSoon')}</p>
                </div>
              </div>
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
          <Button size="lg" asChild>
            <Link href={`/team/${username}/signup`}>
              {t('cta.startJourney')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
