'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import {
  ArrowRight,
  CheckCircle2,
  Quote,
  Award,
  Play,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { MarketingLanguageSwitcher } from '@/components/marketing-language-switcher';
import { useTranslations } from 'next-intl';
import { AudienceSelector } from '@/components/marketing/audience-selector';
import { PillarCards } from '@/components/marketing/pillar-card';

// Testimonials with more emotional, results-focused messaging
const testimonials = [
  {
    name: 'Michael Rodriguez',
    role: 'Former Captive Agent, Now Regional Director',
    initials: 'MR',
    quote: 'After 8 years feeling trapped, I made more in my first year at Apex than my best three years combined. The freedom alone was worth it.',
    highlight: 'Tripled income in year 1',
  },
  {
    name: 'Sarah Kennedy',
    role: 'Former Teacher, Now Senior Associate',
    initials: 'SK',
    quote: 'I went from burned out teacher making $45K to insurance agent making over $85K—working fewer hours and actually enjoying my life again.',
    highlight: 'Career change success',
  },
  {
    name: 'Jennifer Chen',
    role: 'Agency Builder',
    initials: 'JC',
    quote: 'I own my client relationships, my schedule, and my future. That\'s something I never had before Apex.',
    highlight: 'Built team of 50+ agents',
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('marketing');
  const tFooter = useTranslations('footer');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.about')}
            </Link>
            <Link href="/professionals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.forAgents')}
            </Link>
            <Link href="/new-to-insurance" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.newToInsurance')}
            </Link>
            <Link href="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.faq')}
            </Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.contact')}
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <MarketingLanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost">{t('nav.signIn')}</Button>
            </Link>
            <Link href="/signup">
              <Button>{t('nav.joinApex')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Audience Selector - "Movie Trailer" Hero */}
      <AudienceSelector />

      {/* Trust Indicators / Stats */}
      <section className="py-12 border-y bg-slate-50">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted by thousands of agents across America
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">2,500+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">$50M+</div>
              <div className="text-sm text-muted-foreground mt-1">Paid to Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">7</div>
              <div className="text-sm text-muted-foreground mt-1">Top Carriers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">50</div>
              <div className="text-sm text-muted-foreground mt-1">States</div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              What Makes Apex Different
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built For Agents Like You
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three principles guide everything we do—and everything you'll experience at Apex.
            </p>
          </div>

          <PillarCards className="max-w-6xl mx-auto" />
        </div>
      </section>

      {/* Success Stories - More Visual, Less Text */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">
              Real People, Real Results
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              They Made the Switch. So Can You.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-white/5 border-white/10 backdrop-blur">
                <CardContent className="pt-6 text-white">
                  <Quote className="h-8 w-8 text-primary/40 mb-4" />
                  <p className="text-lg mb-6 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                      <span className="text-lg font-semibold text-primary">
                        {testimonial.initials}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-slate-300">{testimonial.highlight}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-slate-400">
              Results vary based on individual effort. See our{' '}
              <Link href="/income-disclaimer" className="text-primary hover:underline">
                income disclaimer
              </Link>
              {' '}for details.
            </p>
          </div>
        </div>
      </section>

      {/* Video Placeholder Section (Future Enhancement) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                See What Your Future Could Look Like
              </h2>
              <p className="text-xl text-muted-foreground">
                A day in the life of an Apex agent
              </p>
            </div>

            {/* Video Placeholder */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-10 w-10 text-slate-900 ml-1" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <Badge className="bg-white/90 text-slate-900">
                  Coming Soon: Agent Success Stories
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get - Simplified */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-muted-foreground">
                No hidden fees. No games. Just real support.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-2">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Your clients are yours immediately</h3>
                  <p className="text-sm text-muted-foreground">
                    No waiting periods. No fine print. 100% ownership from day one.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-2">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Top commission rates</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn what you deserve. Up to 145% on life products.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-2">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">No cost to join</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlike other agencies, we don't charge you enrollment fees.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-2">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Real training & support</h3>
                  <p className="text-sm text-muted-foreground">
                    Not just videos—actual coaching, mentorship, and community.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-2">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">AI-powered tools included</h3>
                  <p className="text-sm text-muted-foreground">
                    CRM, quoting, marketing automation—all provided.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-2">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Build your own agency</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional team building with 6 levels of bonus income.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Emotional */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            Stop Settling. Start Building the Career You Deserve.
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            No obligation. No pressure. Just an honest conversation about what's possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 font-semibold">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              >
                Talk to Someone First
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Join 2,500+ agents who made the switch to Apex
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="space-y-4">
              <Logo size="sm" variant="white" />
              <p className="text-sm text-slate-400">
                {tFooter('brandTagline')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">{tFooter('company')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">{tFooter('aboutUs')}</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">{tFooter('faq')}</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">{tFooter('contact')}</Link></li>
              </ul>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="font-semibold mb-4">{tFooter('getStarted')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/professionals" className="hover:text-white transition-colors">{tFooter('licensedAgents')}</Link></li>
                <li><Link href="/new-to-insurance" className="hover:text-white transition-colors">{tFooter('newToInsurance')}</Link></li>
                <li><Link href="/opportunity" className="hover:text-white transition-colors">{tFooter('careerOpportunity')}</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">{tFooter('joinApex')}</Link></li>
              </ul>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/opportunity#life-insurance" className="hover:text-white transition-colors">Life Insurance</Link></li>
                <li><Link href="/opportunity#annuities" className="hover:text-white transition-colors">Annuities</Link></li>
                <li><Link href="/opportunity#final-expense" className="hover:text-white transition-colors">Final Expense</Link></li>
              </ul>
            </div>

            {/* For Agents */}
            <div>
              <h4 className="font-semibold mb-4">{tFooter('forAgents')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/login" className="hover:text-white transition-colors">{tFooter('agentLogin')}</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">{tFooter('joinApex')}</Link></li>
                <li><Link href="/income-disclaimer" className="hover:text-white transition-colors">{tFooter('incomeDisclosure')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
              <p>{tFooter('copyright', { year: new Date().getFullYear() })}</p>
              <div className="flex gap-6">
                <Link href="/privacy" className="hover:text-white transition-colors">{tFooter('privacy')}</Link>
                <Link href="/terms" className="hover:text-white transition-colors">{tFooter('terms')}</Link>
                <Link href="/income-disclaimer" className="hover:text-white transition-colors">{tFooter('incomeDisclosure')}</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
