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
import { useTranslations } from 'next-intl';
import { CheckCircle, Mail } from 'lucide-react';

function SignupForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tMarketing = useTranslations('marketing');
  const tCrm = useTranslations('crm');
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
  const [success, setSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');

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
    setError(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
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

    try {
      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          sponsorUsername: formData.sponsorUsername || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Success - show verification message
      setCreatedEmail(formData.email);
      setSuccess(true);

    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state - show verification message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Account Created!</CardTitle>
            <CardDescription>
              Welcome to Apex Affinity Group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Check your email</p>
                  <p className="text-sm text-blue-700 mt-1">
                    We sent a verification link to <strong>{createdEmail}</strong>.
                    Click the link to activate your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Didn&apos;t receive the email?</p>
              <p>Check your spam folder or contact support.</p>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo size="md" />
          </div>
          <CardTitle>{tMarketing('nav.joinApex')}</CardTitle>
          <CardDescription>{t('createAccount')}</CardDescription>
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
                <Label htmlFor="firstName">{tCrm('firstName')}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{tCrm('lastName')}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{tCrm('phone')} ({tCommon('optional')})</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('passwordMinLength')}
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder={t('confirmPassword')}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sponsorUsername">Sponsor Code ({tCommon('optional')})</Label>
              <Input
                id="sponsorUsername"
                name="sponsorUsername"
                placeholder="Your sponsor's username"
                value={formData.sponsorUsername}
                onChange={handleChange}
                disabled={loading}
              />
              {sponsorName && (
                <p className="text-sm text-green-600">
                  Sponsor: {sponsorName}
                </p>
              )}
              {formData.sponsorUsername && !sponsorName && (
                <p className="text-sm text-amber-600">
                  Checking sponsor...
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : t('createAccount')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t('login')}
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
