'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sponsorCode = searchParams.get('ref');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    sponsorUsername: sponsorCode || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sponsorName, setSponsorName] = useState<string | null>(null);

  // Look up sponsor when username changes
  useEffect(() => {
    const lookupSponsor = async () => {
      if (!formData.sponsorUsername) {
        setSponsorName(null);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('agents')
        .select('first_name, last_name')
        .eq('username', formData.sponsorUsername)
        .single();

      if (data && !error) {
        const sponsor = data as { first_name: string; last_name: string };
        setSponsorName(`${sponsor.first_name} ${sponsor.last_name}`);
      } else {
        setSponsorName(null);
      }
    };

    const debounce = setTimeout(lookupSponsor, 500);
    return () => clearTimeout(debounce);
  }, [formData.sponsorUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Look up sponsor ID if username provided
    let sponsorId: string | null = null;
    if (formData.sponsorUsername) {
      const { data: sponsor, error: sponsorError } = await supabase
        .from('agents')
        .select('id')
        .eq('username', formData.sponsorUsername)
        .single();

      if (sponsorError || !sponsor) {
        setError('Invalid sponsor code. Please check and try again.');
        setLoading(false);
        return;
      }
      sponsorId = (sponsor as { id: string }).id;
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
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account');
      setLoading(false);
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
      setLoading(false);
      return;
    }

    // Redirect to confirmation page or dashboard
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo size="md" />
          </div>
          <CardTitle>Join Apex</CardTitle>
          <CardDescription>Create your agent account</CardDescription>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="phone">Phone (Optional)</Label>
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
              <Label htmlFor="sponsorUsername">Sponsor Code (Optional)</Label>
              <Input
                id="sponsorUsername"
                name="sponsorUsername"
                placeholder="Your sponsor's username"
                value={formData.sponsorUsername}
                onChange={handleChange}
              />
              {sponsorName && (
                <p className="text-sm text-green-600">
                  Sponsor: {sponsorName}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
