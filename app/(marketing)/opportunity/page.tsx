/**
 * Opportunity Page
 * Income opportunity and career information for recruiting
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Sparkles,
  GraduationCap,
  Target,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Career Opportunity',
  description: 'Start your insurance career with Apex Affinity Group. No enrollment fees, top carrier access, AI-powered tools, and comprehensive training.',
};

const benefits = [
  {
    icon: DollarSign,
    title: 'Competitive Commissions',
    description: 'Earn up to 100% commission on first-year premiums with our top-tier carrier contracts.',
  },
  {
    icon: Users,
    title: '6-Generation Overrides',
    description: 'Build your team and earn override commissions up to 6 levels deep in your organization.',
  },
  {
    icon: TrendingUp,
    title: 'Vested Day One',
    description: 'Your commissions and renewals are yours from day one. No multi-year vesting requirements.',
  },
  {
    icon: Shield,
    title: '7 A-Rated Carriers',
    description: 'Access Columbus Life, AIG, F&G, MOO, NLG, Symetra, and North American.',
  },
  {
    icon: Sparkles,
    title: 'AI Copilot Tools',
    description: 'Our exclusive AI tools help you with sales scripts, objection handling, and lead management.',
  },
  {
    icon: GraduationCap,
    title: 'Comprehensive Training',
    description: 'Live coaching, field training, weekly calls, and ongoing education to keep you sharp.',
  },
  {
    icon: Clock,
    title: 'Flexible Schedule',
    description: 'Work from anywhere, set your own hours. Build a business around your life.',
  },
  {
    icon: Target,
    title: 'No Enrollment Fees',
    description: 'Unlike many agencies, we don\'t charge you to join. Your only investment is your license.',
  },
];

const steps = [
  {
    number: 1,
    title: 'Apply Online',
    description: 'Complete our simple application form. No fees required.',
  },
  {
    number: 2,
    title: 'Interview',
    description: 'Connect with a team leader to learn more and see if we\'re a fit.',
  },
  {
    number: 3,
    title: 'Get Licensed',
    description: 'If you\'re not already licensed, we\'ll guide you through the process.',
  },
  {
    number: 4,
    title: 'Complete Training',
    description: 'Go through our onboarding program and get carrier appointed.',
  },
  {
    number: 5,
    title: 'Start Earning',
    description: 'Begin writing business and building your team.',
  },
];

export default function OpportunityPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Build Your Insurance Business with Apex
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of agents who have chosen Apex Affinity Group to build
              their insurance careers. Top carriers, competitive commissions, and the
              support you need to succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Schedule a Call
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Income Disclaimer Alert */}
      <section className="py-4 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-4">
          <Alert className="border-amber-300 bg-transparent">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Important Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              Income varies based on individual effort, experience, and market conditions.
              Most new agents earn little to nothing in their first year.{' '}
              <Link href="/income-disclaimer" className="underline font-medium">
                Read our full income disclosure
              </Link>.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Agents Choose Apex</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve built a platform that gives independent agents everything they need
              to succeed without the corporate red tape.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compensation Overview</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our compensation plan rewards both personal production and team building.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Personal Production</CardTitle>
                <CardDescription>
                  Earn competitive first-year and renewal commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Up to 100% first-year commission on life products</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Competitive annuity commissions (varies by product)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Renewal commissions paid directly to you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Production bonuses for hitting targets</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Building</CardTitle>
                <CardDescription>
                  Earn override commissions on your team&apos;s production
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Override commissions up to 6 generations deep</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Leadership bonuses at higher ranks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Equity bonuses for top performers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Trip and incentive qualifications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/income-disclaimer" className="text-primary hover:underline">
              View detailed income statistics &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How to Join */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Get Started</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting started with Apex is straightforward. Here&apos;s what to expect.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border hidden md:block" />

              <div className="space-y-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex gap-6 items-start">
                    <div className="shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold z-10">
                      {step.number}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Requirements</h2>
            </div>

            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">18 years or older</span>
                      <p className="text-sm text-muted-foreground">Must be legally able to work in the United States</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Life insurance license</span>
                      <p className="text-sm text-muted-foreground">Required for your state(s). We can help you get licensed if you&apos;re not already.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Pass a background check</span>
                      <p className="text-sm text-muted-foreground">Required by insurance carriers for appointment</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Commitment to training</span>
                      <p className="text-sm text-muted-foreground">Complete our onboarding program and ongoing education</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join successful agents building their business with Apex. No enrollment fees,
            top carrier access, and the support you need to succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/faq">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Read FAQs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
