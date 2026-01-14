import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RANK_CONFIG } from '@/lib/config/ranks';
import type { Agent } from '@/lib/types/database';
import {
  Shield,
  TrendingUp,
  Users,
  Award,
  DollarSign,
  GraduationCap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

// High-quality stock images from Unsplash
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1920&q=80', // Professional team meeting
  success: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80', // Team celebrating
  family: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', // Happy family
};

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function TeamLandingPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData, error } = await supabase
    .from('agents')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Agent;
  const rankConfig = RANK_CONFIG[agent.rank];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.hero}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <p className="text-primary font-medium mb-2">Join Apex Affinity Group</p>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  Build Your Financial Future in Insurance
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Partner with {agent.first_name} {agent.last_name} and join a proven system
                that helps you build a successful career in the insurance industry with
                unlimited earning potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href={`/team/${username}/signup`}>
                    Get Started Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={`/team/${username}/opportunity`}>
                    Learn About the Opportunity
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground">Active Agents</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">$50M+</p>
                  <p className="text-sm text-muted-foreground">Commissions Paid</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">7</p>
                  <p className="text-sm text-muted-foreground">Top Carriers</p>
                </div>
              </div>
            </div>

            {/* Agent Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={agent.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {agent.first_name[0]}{agent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {agent.first_name} {agent.last_name}
                      </h3>
                      <p className="text-muted-foreground">{rankConfig.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ready to help you start your journey with Apex Affinity Group.
                      Let&apos;s build your future together.
                    </p>
                    <div className="pt-4 space-y-3">
                      <Button className="w-full" asChild>
                        <Link href={`/team/${username}/signup`}>Join My Team</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/team/${username}/contact`}>Contact Me</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join Apex?</h2>
            <p className="text-muted-foreground">
              We provide everything you need to succeed in the insurance industry.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">High Commissions</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn up to 90% commission rates with our top-tier carrier contracts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Override Income</h3>
                    <p className="text-sm text-muted-foreground">
                      Build a team and earn 6 generations of overrides on their production.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Complete Training</h3>
                    <p className="text-sm text-muted-foreground">
                      Access comprehensive training programs to fast-track your success.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Top Carriers</h3>
                    <p className="text-sm text-muted-foreground">
                      Work with 7 A-rated carriers offering life insurance and annuities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Team Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Join a supportive community with mentorship at every level.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Bonuses & Incentives</h3>
                    <p className="text-sm text-muted-foreground">
                      Fast start bonuses, rank advancement bonuses, and car bonuses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Getting started is simple. Here&apos;s your path to success.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Join the Team',
                description: 'Complete your application and get licensed with our support.',
              },
              {
                step: '2',
                title: 'Get Trained',
                description: 'Complete our onboarding program and learn the products.',
              },
              {
                step: '3',
                title: 'Start Selling',
                description: 'Help families with their insurance needs and earn commissions.',
              },
              {
                step: '4',
                title: 'Build Your Team',
                description: 'Recruit and train others to multiply your income.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Decorative background image */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 hidden lg:block">
          <Image
            src={IMAGES.success}
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">What You Get When You Join</h2>
              <ul className="space-y-4">
                {[
                  'Access to 7 A-rated insurance carriers',
                  'Comprehensive training and certification support',
                  'Personal back office dashboard',
                  'AI-powered CRM to manage your clients',
                  'Marketing materials and sales tools',
                  'Weekly team calls and mentorship',
                  'Fast start bonus program',
                  'Career advancement opportunities',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary-foreground/80 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-8 border border-primary-foreground/20">
                <p className="text-lg mb-4">Ready to start your journey?</p>
                <h3 className="text-2xl font-bold mb-6">
                  Join {agent.first_name}&apos;s Team Today
                </h3>
                <Button size="lg" variant="secondary" asChild>
                  <Link href={`/team/${username}/signup`}>
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Take the First Step</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of successful agents who have transformed their lives with Apex Affinity Group.
            Your journey starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href={`/team/${username}/signup`}>Join Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/team/${username}/contact`}>Ask Questions First</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
