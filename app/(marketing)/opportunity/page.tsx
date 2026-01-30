/**
 * Opportunity Page - Consolidated & Streamlined
 * Focus on "what's in it for you" - simplified from original
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'The Apex Opportunity | Build Your Insurance Business',
  description: 'Earn what you\'re worth. Own your clients. Build your future. See why 2,500+ agents chose Apex to build their insurance business.',
};

export default function OpportunityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/20 text-primary-foreground border-primary/30">
              The Apex Opportunity
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              What If You Could Earn What You're Actually Worth?
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              No enrollment fees. Top commissions. Own your clients. Build your agency.
              Here's what changes when you join Apex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                  Talk to Someone
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/professionals">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8">
                  I'm Already Licensed
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get - Simplified */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What You Actually Get</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No corporate speak. No fine print. Here's the deal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-2">
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Earn More Money</h3>
                <p className="text-muted-foreground mb-4">
                  Top commission rates (up to 145%). No splits with an agency that doesn't do anything.
                  What you earn is yours.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Highest available commission rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Paid weekly, not monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Bonuses for performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Own Your Future</h3>
                <p className="text-muted-foreground mb-4">
                  Your clients are yours from day one. Build something you can sell or pass down.
                  No waiting periods. No games.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>100% ownership immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Build a sellable asset</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>No one takes it back</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Build a Team (Optional)</h3>
                <p className="text-muted-foreground mb-4">
                  Want to grow an agency? We'll help you recruit, train, and earn bonuses on their success.
                  Don't want to? That's fine too.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>6 levels of team bonuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Recruiting support provided</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Completely optional</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Actually Get Support</h3>
                <p className="text-muted-foreground mb-4">
                  Real training. Real mentorship. Modern tools. Not just "here's some videos, good luck."
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Personal mentor assigned</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>AI tools & CRM included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>Help when you need it</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Insurance Companies - Visual */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Work With 7+ Top Insurance Companies
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Never turn away business because you don't have the right product.
            </p>

            <div className="bg-white rounded-2xl p-8 border-2 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { name: 'Columbus Life', rating: 'A+' },
                  { name: 'AIG', rating: 'A' },
                  { name: 'F&G', rating: 'A' },
                  { name: 'MOO', rating: 'A+' },
                  { name: 'NLG', rating: 'A+' },
                  { name: 'Symetra', rating: 'A' },
                  { name: 'North American', rating: 'A+' },
                ].map((carrier) => (
                  <div key={carrier.name} className="p-4">
                    <div className="font-semibold text-lg mb-1">{carrier.name}</div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {carrier.rating} Rated
                    </Badge>
                  </div>
                ))}
                <div className="p-4 flex items-center justify-center col-span-2 md:col-span-1">
                  <span className="text-muted-foreground font-medium">+ More</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              All A-rated or higher by AM Best. You'll have the products your clients need.
            </p>
          </div>
        </div>
      </section>

      {/* Products We Offer */}
      <section id="life-insurance" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What You'll Sell</h2>
              <p className="text-xl text-muted-foreground">
                Products people actually need to protect their families.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-xl border-2">
                <h3 className="text-xl font-semibold mb-2">Life Insurance</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Term and permanent policies to protect families if something happens.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Who needs it:</strong> Parents, breadwinners, anyone with dependents
                </p>
              </div>

              <div id="annuities" className="p-6 bg-slate-50 rounded-xl border-2">
                <h3 className="text-xl font-semibold mb-2">Annuities</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Retirement income products that provide guaranteed payments.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Who needs it:</strong> Pre-retirees, people planning for retirement
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border-2">
                <h3 className="text-xl font-semibold mb-2">Cash Value Life Insurance</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Permanent coverage that also builds cash value you can access.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Who needs it:</strong> High earners, estate planning, wealth building
                </p>
              </div>

              <div id="final-expense" className="p-6 bg-slate-50 rounded-xl border-2">
                <h3 className="text-xl font-semibold mb-2">Final Expense</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Affordable coverage to help families with funeral and burial costs.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Who needs it:</strong> Seniors, fixed-income families
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Join - Simplified */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How to Get Started</h2>
              <p className="text-xl text-slate-300">
                Five simple steps. No tricks. No hidden fees.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { num: 1, title: "Schedule a Call", desc: "Confidential conversation about your goals and whether Apex is right for you" },
                { num: 2, title: "Get Licensed (if needed)", desc: "Not licensed yet? We'll help you pass your state exam (2-4 weeks)" },
                { num: 3, title: "Complete Training", desc: "Learn our system, products, and tools (1-2 weeks, online)" },
                { num: 4, title: "Get Authorized", desc: "We handle paperwork to connect you with insurance companies (48-72 hours)" },
                { num: 5, title: "Start Earning", desc: "Begin helping clients with full support from your mentor and team" },
              ].map((step) => (
                <div key={step.num} className="flex gap-4 items-start p-6 bg-white/5 rounded-xl border border-white/10">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements - Simplified */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Who Can Join?</h2>
              <p className="text-muted-foreground">
                Pretty simple requirements.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">18+ and able to work in the US</span>
                  <p className="text-sm text-muted-foreground">Basic legal requirements</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Life insurance license (or willing to get one)</span>
                  <p className="text-sm text-muted-foreground">Required by law to sell insurance. We'll help you get it.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Pass a background check</span>
                  <p className="text-sm text-muted-foreground">Required by insurance companies for authorization</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Commit to training</span>
                  <p className="text-sm text-muted-foreground">Complete onboarding and continue learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Income Disclaimer */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-amber-800 mb-2">
              <strong>Important:</strong> Income varies based on effort, experience, and market conditions.
              Most new agents earn little to nothing in their first year.
            </p>
            <Link href="/income-disclaimer" className="text-amber-700 hover:text-amber-900 underline font-medium">
              Read our full income disclosure →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to See If This Is Right For You?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            No pressure. No obligation. Just an honest conversation about what's possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                Schedule a Call
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/professionals">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8">
                I'm Already Licensed
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
