import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Target,
  Heart,
  Shield,
  Award,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import type { Agent } from '@/lib/types/database';

const IMAGES = {
  teamMeeting: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
};

interface PageProps {
  params: Promise<{ agentCode: string }>;
}

export default async function AboutPage({ params }: PageProps) {
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

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.teamMeeting}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4">About Apex Affinity Group</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;re building the future of insurance distribution through empowered
            entrepreneurs and cutting-edge technology.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Our Mission</h2>
                </div>
                <p className="text-muted-foreground">
                  To empower insurance professionals with the tools, training, and support
                  they need to build successful businesses while helping families protect
                  their financial futures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Our Vision</h2>
                </div>
                <p className="text-muted-foreground">
                  To be the premier insurance marketing organization where every agent
                  has the opportunity to achieve financial freedom through ethical business
                  practices and genuine service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Integrity',
                description: 'We do what\'s right for clients, even when no one is watching.',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'We succeed together through collaboration and mutual support.',
              },
              {
                icon: TrendingUp,
                title: 'Growth',
                description: 'We continuously improve ourselves and help others do the same.',
              },
              {
                icon: Award,
                title: 'Excellence',
                description: 'We strive for the highest standards in everything we do.',
              },
            ].map((value) => (
              <Card key={value.title}>
                <CardContent className="pt-6 text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src={IMAGES.office}
                alt="Modern office environment"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Apex Affinity Group was founded by industry veterans who saw a better way
                  to help insurance professionals succeed. After decades of experience in the
                  traditional insurance industry, our founders recognized that agents needed
                  more than just products to sell—they needed a complete business system.
                </p>
                <p>
                  Today, Apex Affinity Group represents hundreds of licensed agents across
                  the country, all working together to help American families protect their
                  financial futures while building thriving careers for themselves.
                </p>
                <p>
                  Our unique approach combines top-tier carrier contracts with comprehensive
                  training, cutting-edge technology, and a proven compensation plan that
                  rewards both personal production and team building.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold mb-2">1000+</p>
              <p className="text-primary-foreground/80">Active Agents</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">7</p>
              <p className="text-primary-foreground/80">Partner Carriers</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">$50M+</p>
              <p className="text-primary-foreground/80">Commissions Paid</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">48</p>
              <p className="text-primary-foreground/80">States Licensed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Us?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Partner with {agent.first_name} {agent.last_name} and become part of the
            Apex Affinity Group family.
          </p>
          <Button size="lg" asChild>
            <Link href={`/join/${agentCode}/signup`}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
