import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  params: Promise<{ agentCode: string }>;
}

export default async function OpportunityPage({ params }: PageProps) {
  const { agentCode } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData, error } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('agent_code', agentCode)
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name'>;
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
          <h1 className="text-4xl font-bold mb-4">The Opportunity</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build a rewarding career in insurance with unlimited earning potential,
            comprehensive training, and a proven path to success.
          </p>
        </div>
      </section>

      {/* Income Streams */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Multiple Income Streams</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our compensation plan rewards you for personal production and team building.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Personal Commissions</CardTitle>
                <CardDescription>Earn up to 90% on your personal sales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get paid directly when you help a family with their insurance needs.
                  Higher ranks mean higher commission rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Override Income</CardTitle>
                <CardDescription>Earn on 6 generations of your team</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Build a team and earn override commissions on their production:
                  15%, 5%, 3%, 2%, 1%, and 0.5% on generations 1-6.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fast Start Bonus</CardTitle>
                <CardDescription>Extra bonus on early production</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Earn additional bonuses on your first 90 days of production.
                  Hit targets and get rewarded for your quick start.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Rank Advancement Bonus</CardTitle>
                <CardDescription>Get paid when you promote</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every time you advance in rank, you receive a one-time bonus.
                  Higher ranks mean bigger advancement bonuses.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Matching Bonus</CardTitle>
                <CardDescription>Match your team&apos;s bonuses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Earn a percentage match on bonuses earned by agents in your
                  organization. Leadership has its rewards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Car Bonus</CardTitle>
                <CardDescription>Monthly car allowance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Qualify for our car bonus program and receive a monthly allowance
                  toward your vehicle. Drive in style while building your business.
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
            <h2 className="text-3xl font-bold mb-4">Your Career Path</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Clear advancement opportunities with increasing benefits at each level.
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
                      <p>90-Day Premium: ${rank.requirements.premium90Days.toLocaleString()}+</p>
                      <p>Personal Recruits: {rank.requirements.personalRecruits}+</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Plus 4 additional leadership ranks: Regional MGA, National MGA, Executive MGA, Premier MGA
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
                <h2 className="text-3xl font-bold">Training & Support</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                We don&apos;t just give you a contract and wish you luck. Our comprehensive
                training and support system ensures you have everything you need to succeed.
              </p>
              <ul className="space-y-3">
                {[
                  'New agent onboarding program',
                  'Product training for all carriers',
                  'Sales and presentation skills',
                  'Weekly team training calls',
                  'One-on-one mentorship',
                  'Marketing materials and tools',
                  'AI-powered CRM system',
                  'Back office dashboard',
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
              <h3 className="text-2xl font-bold mb-4">Is This Right for You?</h3>
              <p className="mb-6 text-primary-foreground/90">
                This opportunity is perfect for people who are:
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  Self-motivated and driven
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  Looking for unlimited income potential
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  Willing to learn and grow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  Interested in helping others
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  Ready to build a business
                </li>
              </ul>
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/join/${agentCode}/signup`}>
                  Apply Now
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
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: 'Do I need to be licensed?',
                a: 'Yes, you need a life insurance license to sell. We will help you get licensed if you aren\'t already.',
              },
              {
                q: 'Is there a cost to join?',
                a: 'There is no cost to join Apex. You may have costs associated with getting licensed in your state.',
              },
              {
                q: 'Is this a pyramid scheme?',
                a: 'No. This is a legitimate insurance business. You earn commissions from selling insurance products, not from recruiting. Team building is optional and provides override income.',
              },
              {
                q: 'How much can I earn?',
                a: 'Your income depends on your effort. Some agents earn part-time income, others build six-figure businesses. There is no cap on earnings.',
              },
              {
                q: 'Do I get leads?',
                a: 'We provide training on lead generation. Many agents work with their natural market initially and then learn to generate leads through various methods.',
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
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join {agent.first_name} {agent.last_name}&apos;s team today and start building
            your future in the insurance industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href={`/join/${agentCode}/signup`}>
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/join/${agentCode}/contact`}>Ask Questions</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
