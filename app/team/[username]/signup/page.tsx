'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Agent } from '@/lib/types/database';
import { RANK_CONFIG } from '@/lib/config/ranks';
import { CheckCircle, ArrowRight, Loader2, AlertCircle, AtSign, Check, X } from 'lucide-react';
import { validateUsername } from '@/lib/utils/username';

export default function ReplicatedSignupPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const t = useTranslations('replicated.signup');

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Username state
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);

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
        .eq('username', username.toLowerCase())
        .single();

      if (data) {
        setAgent(data as Agent);
      }
      setLoading(false);
    };

    fetchAgent();
  }, [username]);

  // Check username availability with debounce
  const checkUsername = useCallback(async (value: string) => {
    if (!value) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    // Client-side validation first
    const validation = validateUsername(value);
    if (!validation.valid) {
      setUsernameStatus('invalid');
      setUsernameError(validation.error || 'Invalid username');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    try {
      const response = await fetch(`/api/username/check?username=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (data.available) {
        setUsernameStatus('available');
        setUsernameError(null);
      } else {
        setUsernameStatus('taken');
        setUsernameError(data.reason || 'Username is not available');
      }
    } catch {
      setUsernameStatus('idle');
      setUsernameError('Failed to check username availability');
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(usernameInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [usernameInput, checkUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsernameInput(value);
  };

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
      setError(t('errors.agreeTerms'));
      setSubmitting(false);
      return;
    }

    // Validate username
    if (!usernameInput || usernameStatus !== 'available') {
      setError(t('errors.usernameRequired'));
      setSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordsNoMatch'));
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t('errors.passwordMinLength'));
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
      setError(t('errors.emailExists'));
      setSubmitting(false);
      return;
    }

    // Create auth user with email verification
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email.toLowerCase(),
      password: formData.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=/team/${username}/signup/success`,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          sponsor_username: username,
        },
      },
    });

    if (authError) {
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        setError(t('errors.emailExists'));
      } else {
        setError(authError.message);
      }
      setSubmitting(false);
      return;
    }

    if (!authData.user) {
      setError(t('errors.createFailed'));
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
      username: usernameInput.toLowerCase(),
      status: 'pending',
      rank: 'pre_associate',
    } as never);

    if (agentError) {
      setError(t('errors.profileFailed'));
      setSubmitting(false);
      return;
    }

    // Redirect to verify email page
    router.push(`/team/${username}/signup/verify-email?email=${encodeURIComponent(formData.email)}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t('agentNotFound')}</p>
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
              <h1 className="text-3xl font-bold mb-4">{t('title', { agentName: agent.first_name })}</h1>
              <p className="text-muted-foreground">
                {t('subtitle')}
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
                    <p className="text-sm text-muted-foreground">{t('yourSponsor')}</p>
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
              <h3 className="font-semibold">{t('whatYouGet')}</h3>
              <ul className="space-y-3">
                {[
                  t('benefits.carriers'),
                  t('benefits.training'),
                  t('benefits.tools'),
                  t('benefits.commissions'),
                  t('benefits.overrides'),
                  t('benefits.bonuses'),
                  t('benefits.mentorship'),
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
                <CardTitle>{t('form.title')}</CardTitle>
                <CardDescription>
                  {t('form.subtitle')}
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
                      <Label htmlFor="firstName">{t('form.firstName')}</Label>
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
                      <Label htmlFor="lastName">{t('form.lastName')}</Label>
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

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('form.chooseTeamUrl')}</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                        <AtSign className="h-4 w-4" />
                        theapexway.net/team/
                      </div>
                      <div className="relative flex-1">
                        <Input
                          id="username"
                          name="username"
                          placeholder="jsmith"
                          value={usernameInput}
                          onChange={handleUsernameChange}
                          className={
                            usernameStatus === 'available' ? 'border-green-500 pr-10' :
                            usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 pr-10' :
                            'pr-10'
                          }
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameStatus === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {usernameStatus === 'available' && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    {usernameError && (
                      <p className="text-sm text-red-600">{usernameError}</p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-sm text-green-600">{t('form.usernameAvailable')}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('form.usernameHelp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('form.email')}</Label>
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
                    <Label htmlFor="phone">{t('form.phone')}</Label>
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
                    <Label htmlFor="password">{t('form.password')}</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={t('form.passwordPlaceholder')}
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('form.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder={t('form.confirmPasswordPlaceholder')}
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
                      {t('form.agreeTermsPart1')}{' '}
                      <Link href={`/team/${username}/terms`} className="text-primary hover:underline" target="_blank">{t('form.termsOfService')}</Link>
                      {' '}{t('form.agreeTermsPart2')}{' '}
                      <Link href={`/team/${username}/privacy`} className="text-primary hover:underline" target="_blank">{t('form.privacyPolicy')}</Link>.
                      {' '}{t('form.agreeTermsPart3')}
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      t('form.creatingAccount')
                    ) : (
                      <>
                        {t('form.createAccount')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {t('form.alreadyHaveAccount')}{' '}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      {t('form.signIn')}
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
