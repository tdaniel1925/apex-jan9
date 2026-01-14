/**
 * Agent Recruitment Landing Page
 * Public page to attract and convert potential agents
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle,
  DollarSign,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
  Clock,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { createClient } from '@/lib/db/supabase-client';

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'High Commissions',
    description: 'Earn up to 90% commission on every sale. No ceiling on your income.',
  },
  {
    icon: Users,
    title: 'Build a Team',
    description: 'Earn override income on 6 generations. Build passive income for life.',
  },
  {
    icon: Shield,
    title: 'Top Carriers',
    description: 'Access to 7 A-rated carriers. Offer the best products to your clients.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Tools',
    description: 'Cutting-edge CRM, lead management, and AI copilot to accelerate your success.',
  },
  {
    icon: GraduationCap,
    title: 'Free Training',
    description: 'Comprehensive training from day one. We invest in your success.',
  },
  {
    icon: Clock,
    title: 'Flexible Schedule',
    description: 'Work on your terms. Full-time or part-time opportunity.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Michael T.',
    role: 'Regional Manager',
    quote: 'I went from $0 to $15k/month in my first year. The training and support here is incredible.',
    image: null,
  },
  {
    name: 'Sarah K.',
    role: 'District Manager',
    quote: 'The AI tools helped me double my productivity. I can manage twice the clients now.',
    image: null,
  },
  {
    name: 'James R.',
    role: 'Senior Associate',
    quote: 'Started part-time while keeping my job. Now I do this full-time and love it.',
    image: null,
  },
];

const RANKS = [
  { name: 'Associate', rate: '30%', color: 'bg-slate-500' },
  { name: 'Senior Associate', rate: '35%', color: 'bg-blue-500' },
  { name: 'District Manager', rate: '40%', color: 'bg-green-500' },
  { name: 'Regional Manager', rate: '45%', color: 'bg-purple-500' },
  { name: 'National Manager', rate: '50%', color: 'bg-orange-500' },
  { name: 'Executive Director', rate: '55%', color: 'bg-amber-500' },
];

export default function JoinPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!agreed) {
      setError('You must agree to the terms to continue.');
      setSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setSubmitting(false);
      return;
    }

    const supabase = createClient();

    // If referral code provided, verify it
    let sponsorId: string | null = null;
    if (formData.referralCode) {
      const { data: sponsor } = await supabase
        .from('agents')
        .select('id')
        .eq('agent_code', formData.referralCode)
        .single() as unknown as { data: { id: string } | null; error: unknown };

      if (sponsor) {
        sponsorId = sponsor.id;
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account');
      setSubmitting(false);
      return;
    }

    // Create agent record
    const { error: agentError } = await supabase.from('agents').insert({
      user_id: authData.user.id,
      sponsor_id: sponsorId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone || null,
      status: 'pending',
      rank: 'pre_associate',
    } as never);

    if (agentError) {
      setError('Failed to create agent profile. Please contact support.');
      setSubmitting(false);
      return;
    }

    // Redirect to dashboard
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Join 500+ Successful Agents
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Build Your Financial Future in{' '}
              <span className="text-primary">Insurance</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Apex Affinity Group and get access to top carriers, industry-leading commissions,
              and the tools you need to succeed. No experience required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setShowForm(true)}>
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#benefits">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">7</p>
              <p className="text-sm text-muted-foreground">A-Rated Carriers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">90%</p>
              <p className="text-sm text-muted-foreground">Max Commission</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">$0</p>
              <p className="text-sm text-muted-foreground">Startup Cost</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">6</p>
              <p className="text-sm text-muted-foreground">Override Levels</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join Apex?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide everything you need to build a successful insurance business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {BENEFITS.map((benefit) => (
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
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Earn More as You Grow</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your commission rate increases as you advance. Build your team and earn override income too.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {RANKS.map((rank, index) => (
                <Card key={rank.name} className={index === RANKS.length - 1 ? 'border-primary' : ''}>
                  <CardContent className="pt-6 text-center">
                    <div className={`h-3 w-3 rounded-full ${rank.color} mx-auto mb-3`} />
                    <p className="font-medium">{rank.name}</p>
                    <p className="text-2xl font-bold text-primary mt-1">{rank.rate}</p>
                    <p className="text-xs text-muted-foreground mt-1">commission</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-6 bg-primary/5 rounded-xl">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Override Income Example</p>
                  <p className="text-sm text-muted-foreground">
                    As a District Manager (40%), you earn 10% override on your Senior Associates (30%),
                    and 5% on their Associates. Build a team of 10 and earn $2,000+ monthly in passive income.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from agents who transformed their lives with Apex.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-sm">
                        {testimonial.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Signup Form */}
      <section id="apply" className="py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Start Your Journey Today</CardTitle>
                <CardDescription>
                  Fill out the form below to apply. We&apos;ll get you started right away.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <Input
                      id="referralCode"
                      name="referralCode"
                      placeholder="Enter if referred by an agent"
                      value={formData.referralCode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                      I agree to the{' '}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      . I understand that I will need to obtain proper licensing to sell insurance.
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      'Creating Account...'
                    ) : (
                      <>
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign In
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            Questions? Contact us at{' '}
            <a href="mailto:join@theapexway.net" className="text-primary hover:underline">
              join@theapexway.net
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Apex Affinity Group. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
