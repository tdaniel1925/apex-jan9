import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Briefcase,
  Clock,
  Award,
  Building2,
  Zap,
  Target,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Licensed Insurance Professionals | Apex Affinity Group',
  description: 'Already licensed? Take your insurance career to the next level with Apex. Higher commissions, better support, and unlimited growth potential.',
  keywords: ['licensed insurance agent', 'insurance career change', 'higher commissions', 'IMO', 'FMO', 'insurance agency'],
};

export default function ProfessionalsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-amber-500/20 text-amber-400 border-amber-500/30">
              For Licensed Insurance Professionals
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              You&apos;ve Built the Skills.
              <span className="text-amber-500 block mt-2">Now Build Real Wealth.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Stop leaving money on the table. Join an organization that rewards your experience
              with higher commissions, ownership of your book, and a clear path to agency building.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/join">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  See Our Compensation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Schedule a Call
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Sound Familiar?</h2>
            <p className="text-center text-muted-foreground mb-12">
              If you&apos;re experiencing any of these, it might be time for a change.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Commission splits that favor the agency, not you',
                'No ownership of your client relationships',
                'Limited product options forcing you to turn away business',
                'Lack of support when you need help closing deals',
                'No clear path to building your own agency',
                'Outdated technology making your job harder',
                'Captive contracts limiting your growth',
                'Production requirements that feel like quotas',
              ].map((pain, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm font-bold">✗</span>
                  </div>
                  <p className="text-slate-700">{pain}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Apex Offers Experienced Agents</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We built Apex for producers like you who deserve better.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Up to 145% Contracts</h3>
                <p className="text-muted-foreground">
                  Street-level contracts from day one. Your production, your commissions.
                  No splits with a middleman.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Vested Day One</h3>
                <p className="text-muted-foreground">
                  Your book is YOUR book. Full ownership of renewals from the start.
                  No vesting schedules or clawback games.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Building2 className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">7 A-Rated Carriers</h3>
                <p className="text-muted-foreground">
                  Columbus Life, AIG, F&G, and more. Never turn away a client because
                  you don&apos;t have the right product.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Build Your Agency</h3>
                <p className="text-muted-foreground">
                  6 levels of override income. We&apos;ll help you recruit, train, and
                  build a team that generates passive income.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Tools</h3>
                <p className="text-muted-foreground">
                  CRM, quoting tools, AI sales assistant, and marketing automation.
                  Technology that makes you more productive.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Quotas</h3>
                <p className="text-muted-foreground">
                  We&apos;re not here to micromanage. You&apos;re a professional.
                  Set your own goals, work your own way.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How We Compare
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div></div>
              <div className="font-semibold text-amber-500">Apex Affinity</div>
              <div className="font-semibold text-slate-400">Typical Captive</div>
            </div>
            {[
              { label: 'Commission Level', apex: 'Up to 145%', captive: '50-80%' },
              { label: 'Book Ownership', apex: '100% Vested', captive: 'Agency Owned' },
              { label: 'Product Options', apex: '7+ Carriers', captive: '1 Carrier' },
              { label: 'Override Income', apex: '6 Levels Deep', captive: 'Limited/None' },
              { label: 'Quotas', apex: 'None', captive: 'Monthly Requirements' },
              { label: 'Contract Type', apex: 'Independent', captive: 'Captive/Exclusive' },
            ].map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 py-4 border-b border-slate-700 items-center"
              >
                <div className="font-medium">{row.label}</div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {row.apex}
                  </span>
                </div>
                <div className="text-center text-slate-400">{row.captive}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transition Support */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Seamless Transition Support</h2>
              <p className="text-xl text-muted-foreground">
                We make switching easy so you can focus on what you do best—selling.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Fast Contracting</h3>
                    <p className="text-muted-foreground">
                      Get contracted with all carriers within 48-72 hours.
                      Start writing business immediately.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Appointment Transfers</h3>
                    <p className="text-muted-foreground">
                      We&apos;ll help navigate carrier appointment transfers
                      and handle the paperwork.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Production Bonuses</h3>
                    <p className="text-muted-foreground">
                      Qualify for transition bonuses based on your
                      prior 12-month production history.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 rounded-2xl p-8">
                <h3 className="text-xl font-semibold mb-4">What to Expect</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">1</span>
                    <span>Schedule a confidential call to discuss your goals</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">2</span>
                    <span>Review contracts and compensation structure</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">3</span>
                    <span>Complete contracting (48-72 hours)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">4</span>
                    <span>Get access to systems, training, and support</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">5</span>
                    <span>Start writing business with full support</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl text-amber-500 mb-6">&ldquo;</div>
            <blockquote className="text-xl md:text-2xl text-slate-700 mb-6">
              After 8 years captive, I thought I knew what success looked like.
              My first year at Apex, I made more than my best three years combined at my old agency.
              The freedom, the support, the technology—it&apos;s a completely different game.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center">
                <span className="font-semibold text-amber-700">MR</span>
              </div>
              <div className="text-left">
                <p className="font-semibold">Michael Rodriguez</p>
                <p className="text-sm text-muted-foreground">Former Captive Agent, Now Regional Director</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Take Control of Your Career?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Schedule a confidential conversation. No pressure, no obligation—just
            an honest look at what&apos;s possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                View Compensation Details
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Schedule a Call
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-6">
            All conversations are 100% confidential.
          </p>
        </div>
      </section>
    </div>
  );
}
