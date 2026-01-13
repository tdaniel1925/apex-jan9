'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Agent } from '@/lib/types/database';
import { RANK_CONFIG } from '@/lib/config/ranks';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function ReplicatedSignupPage() {
  const router = useRouter();
  const params = useParams();
  const agentCode = params.agentCode as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchAgent = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_code', agentCode)
        .single();

      if (data) {
        setAgent(data as Agent);
      }
      setLoading(false);
    };

    fetchAgent();
  }, [agentCode]);

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

    // Check for duplicate email in agents table
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id, email')
      .eq('email', formData.email.toLowerCase())
      .maybeSingle();

    if (existingAgent) {
      setError('An account with this email already exists. Please sign in instead.');
      setSubmitting(false);
      return;
    }

    // Create auth user with email verification
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email.toLowerCase(),
      password: formData.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=/join/${agentCode}/signup/success`,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          sponsor_agent_code: agentCode,
        },
      },
    });

    if (authError) {
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(authError.message);
      }
      setSubmitting(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account');
      setSubmitting(false);
      return;
    }

    // Create agent record with sponsor pre-filled (status pending_verification until email confirmed)
    const { error: agentError } = await supabase.from('agents').insert({
      user_id: authData.user.id,
      sponsor_id: agent?.id || null,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email.toLowerCase(),
      phone: formData.phone || null,
      status: 'pending',
      rank: 'pre_associate',
    } as never);

    if (agentError) {
      setError('Failed to create agent profile. Please contact support.');
      setSubmitting(false);
      return;
    }

    // Redirect to verify email page
    router.push(`/join/${agentCode}/signup/verify-email?email=${encodeURIComponent(formData.email)}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  const rankConfig = RANK_CONFIG[agent.rank];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left side - Benefits */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-4">Join {agent.first_name}&apos;s Team</h1>
              <p className="text-muted-foreground">
                Start your journey with Apex Affinity Group and build a rewarding career
                in the insurance industry.
              </p>
            </div>

            {/* Sponsor Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={agent.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {agent.first_name[0]}{agent.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Sponsor</p>
                    <p className="text-lg font-semibold">
                      {agent.first_name} {agent.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{rankConfig.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="font-semibold">What You Get:</h3>
              <ul className="space-y-3">
                {[
                  'Access to 7 A-rated insurance carriers',
                  'Comprehensive training program',
                  'AI-powered CRM and back office',
                  'Up to 90% commission rates',
                  '6 generations of override income',
                  'Bonuses and incentive programs',
                  'Personal mentorship from your sponsor',
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right side - Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Fill out the form below to get started with Apex Affinity Group.
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

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                      I agree to the{' '}
                      <Link href={`/join/${agentCode}/terms`} className="text-primary hover:underline" target="_blank">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href={`/join/${agentCode}/privacy`} className="text-primary hover:underline" target="_blank">Privacy Policy</Link>.
                      I understand that I will need to obtain proper licensing to sell insurance.
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      'Creating Account...'
                    ) : (
                      <>
                        Create Account
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
      </div>
    </div>
  );
}
