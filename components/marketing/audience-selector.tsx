'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Award, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AudienceType = 'licensed' | 'newcomer' | null;

interface AudienceSelectorProps {
  onSelect?: (audience: AudienceType) => void;
  className?: string;
}

export function AudienceSelector({ onSelect, className }: AudienceSelectorProps): JSX.Element {
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>(null);
  const [showContent, setShowContent] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  const handleSelect = useCallback((audience: AudienceType) => {
    setSelectedAudience(audience);
    setShowContent(true);
    onSelect?.(audience);
  }, [onSelect]);

  // Smooth scroll when content becomes visible
  useEffect(() => {
    if (!showContent || !contentRef.current) return;

    const timeoutId = setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [showContent]);

  const handleKeyDown = useCallback((audience: AudienceType, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(audience);
    }
  }, [handleSelect]);

  const handleLicensedClick = useCallback(() => handleSelect('licensed'), [handleSelect]);
  const handleNewcomerClick = useCallback(() => handleSelect('newcomer'), [handleSelect]);
  const handleLicensedKeyDown = useCallback((e: React.KeyboardEvent) => handleKeyDown('licensed', e), [handleKeyDown]);
  const handleNewcomerKeyDown = useCallback((e: React.KeyboardEvent) => handleKeyDown('newcomer', e), [handleKeyDown]);

  return (
    <div className={cn('w-full', className)}>
      {/* Hero Section with Choice */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />

        {/* Hero Background Image (Placeholder) */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-r from-slate-900 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center mb-16">
            <Badge className="mb-6 bg-primary/20 text-primary-foreground border-primary/30 text-base px-4 py-2">
              Welcome to Apex Affinity Group
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Love What You Do.
              <span className="text-primary block mt-2">Own Your Future.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
              Build a career in insurance with the freedom, support, and income you deserve.
            </p>
          </div>

          {/* Audience Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Licensed Professionals Card */}
            <Card
              className={cn(
                "border-2 hover:border-amber-500 transition-all cursor-pointer group",
                "hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1",
                selectedAudience === 'licensed' && "border-amber-500 shadow-2xl shadow-amber-500/20"
              )}
              role="button"
              tabIndex={0}
              onClick={handleLicensedClick}
              onKeyDown={handleLicensedKeyDown}
              aria-label="Select licensed professionals path"
            >
              <CardContent className="p-8">
                {/* Image Placeholder */}
                <div className="relative h-48 mb-6 rounded-lg overflow-hidden bg-amber-500/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Award className="h-20 w-20 text-amber-500 opacity-50" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  <Badge className="absolute top-4 left-4 bg-amber-500 text-black">
                    For Licensed Agents
                  </Badge>
                </div>

                <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-amber-600 transition-colors">
                  I&apos;m Already Licensed
                </h3>
                <p className="text-muted-foreground mb-6">
                  You&apos;ve built the skills. Now it&apos;s time to build real wealth with top commissions,
                  full ownership of your book, and the freedom to grow your agency.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Top-tier commission rates (up to 145%)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Own your client relationships from day one</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Build and grow your own agency</span>
                  </li>
                </ul>

                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold group-hover:shadow-lg"
                  size="lg"
                >
                  See Why Agents Switch
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Newcomers Card */}
            <Card
              className={cn(
                "border-2 hover:border-emerald-500 transition-all cursor-pointer group",
                "hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1",
                selectedAudience === 'newcomer' && "border-emerald-500 shadow-2xl shadow-emerald-500/20"
              )}
              role="button"
              tabIndex={0}
              onClick={handleNewcomerClick}
              onKeyDown={handleNewcomerKeyDown}
              aria-label="Select new to insurance path"
            >
              <CardContent className="p-8">
                {/* Image Placeholder */}
                <div className="relative h-48 mb-6 rounded-lg overflow-hidden bg-emerald-500/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-20 w-20 text-emerald-500 opacity-50" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  <Badge className="absolute top-4 left-4 bg-emerald-500 text-black">
                    No Experience Needed
                  </Badge>
                </div>

                <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-emerald-600 transition-colors">
                  I&apos;m New to Insurance
                </h3>
                <p className="text-muted-foreground mb-6">
                  No license? No problem. We&apos;ll help you get licensed, trained, and earning.
                  Start a career with unlimited potential and true flexibility.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Complete training and licensing support</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Personal mentor to guide your journey</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>No cost to join, unlimited income potential</span>
                  </li>
                </ul>

                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold group-hover:shadow-lg"
                  size="lg"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Not Sure Option */}
          <div className="text-center mt-8">
            <p className="text-slate-400 mb-3">Not sure which path is right for you?</p>
            <Link href="/contact">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Talk to Someone First
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Content Section */}
      {showContent && (
        <section ref={contentRef} id="audience-content" className="py-20 bg-white scroll-mt-20">
          <div className="container mx-auto px-4">
            {selectedAudience === 'licensed' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <Badge className="mb-4 bg-amber-500/20 text-amber-700 border-amber-500/30">
                    For Licensed Professionals
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Stop Settling. Start Thriving.
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    You&apos;ve worked too hard to leave money on the table or build someone else&apos;s empire.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <Card className="border-2">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-amber-600 mb-2">145%</div>
                      <div className="text-sm text-muted-foreground">Commission Rates</div>
                      <p className="mt-4 text-sm">Top-tier earnings from day one. Your sales, your commissions.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-amber-600 mb-2">100%</div>
                      <div className="text-sm text-muted-foreground">Ownership</div>
                      <p className="mt-4 text-sm">Your clients are yours immediately. No waiting, no games.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-amber-600 mb-2">6 Levels</div>
                      <div className="text-sm text-muted-foreground">Team Bonuses</div>
                      <p className="mt-4 text-sm">Build your agency and earn bonuses on your team&apos;s success.</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Link href="/professionals">
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                      Learn More About the Opportunity
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {selectedAudience === 'newcomer' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <Badge className="mb-4 bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                    New to Insurance
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    You Don&apos;t Need Experience. You Need the Right Support.
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    We&apos;ll teach you everything you need to succeed—from getting licensed to closing your first sale.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <Card className="border-2">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-emerald-600 mb-2">2-4</div>
                      <div className="text-sm text-muted-foreground">Weeks to Licensed</div>
                      <p className="mt-4 text-sm">Get your insurance license with our study support and guidance.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-emerald-600 mb-2">$0</div>
                      <div className="text-sm text-muted-foreground">Cost to Join</div>
                      <p className="mt-4 text-sm">No enrollment fees. Just the cost of your state licensing exam.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-emerald-600 mb-2">1-on-1</div>
                      <div className="text-sm text-muted-foreground">Personal Mentor</div>
                      <p className="mt-4 text-sm">A dedicated mentor who&apos;s been where you are guides your journey.</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Link href="/new-to-insurance">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                      See Your Path to Success
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
