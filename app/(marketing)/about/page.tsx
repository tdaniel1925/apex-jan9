/**
 * About Page - "Why Apex Is For You"
 * Redesigned to focus on visitor benefits, not company history
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Heart,
  Shield,
  CheckCircle2,
  ArrowRight,
  XCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Why Apex Is For You | Apex Affinity Group',
  description: 'Discover why thousands of agents choose Apex for higher commissions, real ownership, and genuine support. See if we\'re the right fit for your career.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary-foreground border-primary/30">
            Why Apex Affinity Group
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
            We Built Apex For Agents Like You
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Tired of low commissions, corporate red tape, and agencies that don't have your back?
            We felt the same way. That's why we created something better.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              See If We're Right For You
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* The Problem We Saw */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Problem We Saw in the Industry
              </h2>
              <p className="text-xl text-muted-foreground">
                Too many talented agents were getting a raw deal.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-red-100 bg-red-50/50">
                <CardContent className="pt-6">
                  <XCircle className="h-10 w-10 text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Low Commission Splits</h3>
                  <p className="text-muted-foreground">
                    Agencies keeping 50-60% while agents did all the work. Your sales, their profits.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-100 bg-red-50/50">
                <CardContent className="pt-6">
                  <XCircle className="h-10 w-10 text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Real Ownership</h3>
                  <p className="text-muted-foreground">
                    Build relationships for years, only to lose them if you leave. Your clients weren't really yours.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-100 bg-red-50/50">
                <CardContent className="pt-6">
                  <XCircle className="h-10 w-10 text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Limited Product Options</h3>
                  <p className="text-muted-foreground">
                    Forced to sell only one company's products, turning away clients who needed something else.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-100 bg-red-50/50">
                <CardContent className="pt-6">
                  <XCircle className="h-10 w-10 text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Empty Training Promises</h3>
                  <p className="text-muted-foreground">
                    "World-class training" that was just outdated videos and zero real support when you needed it.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What We Built For You */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What We Built For You
              </h2>
              <p className="text-xl text-muted-foreground">
                An organization where agents actually come first.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-2xl border-2 p-8 mb-12">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-4 px-4 font-semibold"></th>
                      <th className="text-center py-4 px-4">
                        <div className="font-semibold text-primary text-lg">Apex Affinity</div>
                      </th>
                      <th className="text-center py-4 px-4">
                        <div className="font-semibold text-slate-500">Typical Agency</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Commission Rates</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-green-600 font-semibold">Up to 145%</span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-500">50-80%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Client Ownership</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-green-600 font-semibold">Yours from day 1</span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-500">Agency owned</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Insurance Companies</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-green-600 font-semibold">7+ top carriers</span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-500">1 carrier</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Team Bonuses</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-green-600 font-semibold">6 levels deep</span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-500">Limited or none</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Sales Quotas</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-green-600 font-semibold">None</span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-500">Monthly requirements</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-medium">Enrollment Fees</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-green-600 font-semibold">$0</span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-500">$500-2,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Our Principles */}
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your Success = Our Success</h3>
                  <p className="text-muted-foreground">
                    We only win when you win. That alignment changes everything.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">People Over Profits</h3>
                  <p className="text-muted-foreground">
                    We care about your long-term success, not just this month's numbers.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Integrity Always</h3>
                  <p className="text-muted-foreground">
                    Transparent income disclosures. Honest expectations. Ethical practices.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Where You Fit In */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Where You Fit In
              </h2>
              <p className="text-xl text-muted-foreground">
                You're not just joining an agency. You're building a business.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">You'll Own Your Future</h3>
                  <p className="text-muted-foreground">
                    Your client relationships belong to you. Your income grows with your effort.
                    Build something that's truly yours—even an agency you can pass down or sell.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">You'll Have Real Support</h3>
                  <p className="text-muted-foreground">
                    Not just lip service. Personal mentorship, live training, case support, and a
                    community that actually wants to see you succeed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">You'll Work With Top Products</h3>
                  <p className="text-muted-foreground">
                    Access to 7+ top-rated insurance companies means you'll never have to turn
                    away a client because you don't have the right product.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">You'll Be Part of Something Bigger</h3>
                  <p className="text-muted-foreground">
                    Join 2,500+ agents across 50 states who are building their dreams while
                    helping families protect what matters most.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Track Record */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              We've Been Doing This A While
            </h2>
            <p className="text-xl text-slate-300 mb-12">
              These aren't projections. This is what we've actually built together.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">2,500+</div>
                <div className="text-sm text-slate-400">Active Agents</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">7</div>
                <div className="text-sm text-slate-400">Top-Rated Carriers</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">$50M+</div>
                <div className="text-sm text-slate-400">Paid to Agents</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50</div>
                <div className="text-sm text-slate-400">States Served</div>
              </div>
            </div>

            <p className="text-sm text-slate-400 mt-8">
              We didn't grow through aggressive recruiting or empty promises.
              We grew because agents succeeded—and told their friends.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to See If We're Right For You?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              No obligation. No pressure. Just an honest conversation about your goals
              and whether Apex can help you reach them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/professionals">
                <Button size="lg" className="text-lg px-8">
                  I'm Already Licensed
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/new-to-insurance">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  I'm New to Insurance
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
