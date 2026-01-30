import Link from 'next/link';
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
  XCircle,
} from 'lucide-react';
import { Metadata } from 'next';
import { CommissionCalculator } from '@/components/marketing/commission-calculator';

export const metadata: Metadata = {
  title: 'For Licensed Professionals | Why Agents Switch to Apex',
  description: 'Stop leaving money on the table. Higher commissions, ownership of your clients, and the freedom to build your own agency. See why agents switch to Apex.',
  keywords: ['licensed insurance agent', 'insurance career change', 'higher commissions', 'insurance agency', 'agent ownership'],
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
              You&apos;ve Worked Too Hard
              <span className="text-amber-500 block mt-2">To Settle For Less</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Stop leaving money on the table. Stop building someone else's empire.
              It's time to earn what you're worth and own what you build.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  See What You Could Earn
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#comparison">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Compare Your Current Deal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points - Visual Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Sound Familiar?</h2>
            <p className="text-center text-muted-foreground mb-12">
              If any of these hit home, keep reading.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Splitting commissions with an agency that doesn't do anything for you",
                "Clients you built relationships with—but don't actually own",
                "Stuck selling one company's products, turning away business",
                "No real support when you need help closing deals",
                "No clear path to building your own thing",
              ].map((pain) => (
                <div key={pain} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-100">
                  <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700">{pain}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Apex Offers - Simplified */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What If You Could Keep More of What You Earn?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Here's what changes when you switch to Apex.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Top Commission Rates</h3>
                <p className="text-muted-foreground">
                  Earn up to 145% on life products. No splits. No middleman taking a cut of your hard work.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your Clients Are Yours</h3>
                <p className="text-muted-foreground">
                  Full ownership from day one. No waiting period. No fine print. Build your book, keep your book.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Building2 className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">7+ Top Insurance Companies</h3>
                <p className="text-muted-foreground">
                  Never turn away business again. Access to multiple top-rated carriers means the right product every time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Build Your Own Agency</h3>
                <p className="text-muted-foreground">
                  Want to grow a team? We'll help you recruit, train, and earn bonuses on their success. 6 levels deep.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Modern Tools Included</h3>
                <p className="text-muted-foreground">
                  CRM, quoting tools, AI assistant, and marketing automation. All provided, no extra fees.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-amber-500/50 transition-colors">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Sales Quotas</h3>
                <p className="text-muted-foreground">
                  You're a professional. Set your own goals, work your own way. We're not here to micromanage.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Commission Calculator */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <CommissionCalculator />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How Apex Compares to Where You Are Now
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-white/20">
                    <th className="text-left py-4 px-4"></th>
                    <th className="text-center py-4 px-4">
                      <div className="font-semibold text-amber-500 text-lg">Apex</div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="font-semibold text-slate-400">Typical Agency</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {[
                    { label: 'Commission Rates', apex: 'Up to 145%', other: '50-80%' },
                    { label: 'Client Ownership', apex: 'Yours immediately', other: 'Agency owned' },
                    { label: 'Insurance Companies', apex: '7+ top carriers', other: '1 carrier' },
                    { label: 'Team Bonuses', apex: '6 levels', other: 'Limited/None' },
                    { label: 'Monthly Quotas', apex: 'None', other: 'Required' },
                    { label: 'Enrollment Fees', apex: '$0', other: '$500-2,000' },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-white/10"
                    >
                      <td className="py-4 px-4 font-medium">{row.label}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center gap-2 text-green-400 font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          {row.apex}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-400">{row.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Transition Support - Simplified */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Switching Is Easier Than You Think</h2>
              <p className="text-xl text-muted-foreground">
                We've helped hundreds of agents make the transition. Here's how it works.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Get Set Up Fast</h3>
                    <p className="text-muted-foreground">
                      Authorized to sell with all carriers within 48-72 hours. Start earning immediately.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">We Handle the Paperwork</h3>
                    <p className="text-muted-foreground">
                      Transferring authorizations and setting up accounts. We'll walk you through it.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Transition Bonuses Available</h3>
                    <p className="text-muted-foreground">
                      Based on your past performance, you may qualify for transition bonuses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-8 border-2 border-amber-100">
                <h3 className="text-xl font-semibold mb-4">What to Expect</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">1</span>
                    <span>Confidential conversation about your goals</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">2</span>
                    <span>Review commission structure and support</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">3</span>
                    <span>Complete setup (48-72 hours)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">4</span>
                    <span>Access systems, training, and support</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center shrink-0">5</span>
                    <span>Start earning higher commissions</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial - More Emotional */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl text-amber-500 mb-6">&ldquo;</div>
            <blockquote className="text-xl md:text-2xl mb-8 leading-relaxed">
              After 8 years feeling trapped by low commissions and corporate BS,
              I made more in my first year at Apex than my best three years combined.
              The freedom alone was worth the switch—but the money didn't hurt either.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center">
                <span className="font-semibold text-amber-400 text-xl">MR</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Michael Rodriguez</p>
                <p className="text-sm text-slate-400">Former Exclusive Agent → Regional Director</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Tripled income in year 1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Stop Settling?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            No obligation. No pressure. Just an honest conversation about what you're earning now
            and what you could be earning at Apex.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-lg px-8">
                See Your Potential Earnings
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More About Apex
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            All conversations are 100% confidential.
          </p>
        </div>
      </section>
    </div>
  );
}
