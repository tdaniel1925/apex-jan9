import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Quote, Star, ArrowRight } from 'lucide-react';
import type { Agent } from '@/lib/types/database';

interface PageProps {
  params: Promise<{ username: string }>;
}

const testimonials = [
  {
    name: 'Michael Johnson',
    role: 'Regional MGA',
    image: null,
    quote: 'Joining Apex was the best decision I ever made. In just 2 years, I went from struggling in a corporate job to running my own successful insurance business. The training and support are unmatched.',
    years: 3,
  },
  {
    name: 'Sarah Williams',
    role: 'Senior MGA',
    image: null,
    quote: 'I was a stay-at-home mom looking for a way to contribute to my family\'s income. Apex gave me the flexibility to work on my own schedule while building a real career. I\'m now earning more than I ever did in my previous career.',
    years: 2,
  },
  {
    name: 'David Chen',
    role: 'MGA',
    image: null,
    quote: 'The compensation plan is incredible. I\'m earning more from my overrides than I am from my personal production. Building a team has been the key to my success.',
    years: 4,
  },
  {
    name: 'Amanda Rodriguez',
    role: 'Associate MGA',
    image: null,
    quote: 'What I love most about Apex is the culture. Everyone is willing to help you succeed. My upline has been like a mentor to me, always available to answer questions and provide guidance.',
    years: 1,
  },
  {
    name: 'Robert Thompson',
    role: 'National MGA',
    image: null,
    quote: 'I\'ve been in the insurance industry for 20 years, and I\'ve never seen a better opportunity than Apex. The carrier contracts, the comp plan, the technology - it\'s all world-class.',
    years: 5,
  },
  {
    name: 'Jennifer Martinez',
    role: 'Senior Agent',
    image: null,
    quote: 'I was skeptical at first, but after seeing my first commission check, I was hooked. The products sell themselves when you believe in what you\'re offering.',
    years: 1,
  },
];

export default async function TestimonialsPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData, error } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name'>;

  return (
    <div>
      {/* Hero */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Success Stories</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from agents who have transformed their lives with Apex Affinity Group.
          </p>
        </div>
      </section>

      {/* Featured Testimonial */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground max-w-4xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <Quote className="h-12 w-12 mb-6 opacity-50" />
              <blockquote className="text-2xl font-medium mb-6">
                &ldquo;When I joined Apex, I had no idea it would completely change my life.
                Three years later, I&apos;ve built a team of over 50 agents and achieved
                financial freedom. The systems, training, and support made all the difference.&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">James Davis</p>
                  <p className="text-primary-foreground/80">Executive MGA | 3 Years with Apex</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">More Success Stories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="h-full">
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground flex-1 mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role} | {testimonial.years} year{testimonial.years > 1 ? 's' : ''} with Apex
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real Results</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our agents are achieving incredible results. Here&apos;s what success looks like at Apex.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">$125K+</p>
              <p className="text-muted-foreground">Average top agent income</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">94%</p>
              <p className="text-muted-foreground">Agent satisfaction rate</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">48</p>
              <p className="text-muted-foreground">New MGAs this year</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">$2.5M</p>
              <p className="text-muted-foreground">Bonuses paid last quarter</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Testimonials Placeholder */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Video Testimonials</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Watch our agents share their stories in their own words.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-video bg-muted rounded-lg flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-primary ml-1" />
                  </div>
                  <p className="text-sm text-muted-foreground">Coming Soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Write Your Success Story</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join {agent.first_name} {agent.last_name} and the hundreds of agents
            who are building their dreams with Apex Affinity Group.
          </p>
          <Button size="lg" asChild>
            <Link href={`/team/${username}/signup`}>
              Start Your Journey
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
