'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertCircle, Loader2, Eye, EyeOff, Building2, User, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';

type CorporateAuthMode = 'password' | 'magic-link' | 'magic-link-sent';

export default function AdminLoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'corporate' | 'agent'>('corporate');
  const [corporateAuthMode, setCorporateAuthMode] = useState<CorporateAuthMode>('magic-link');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signOut } = useAuth();

  // Handle error from URL params (e.g., from magic link verification)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  // Clear error when switching tabs or auth mode
  useEffect(() => {
    setError(null);
  }, [loginType, corporateAuthMode]);

  // Handle magic link request
  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send magic link');
        return;
      }

      // Switch to sent mode
      setCorporateAuthMode('magic-link-sent');
    } catch (err) {
      console.error('Magic link error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle corporate staff login (RBAC system)
  const handleCorporateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store the admin token
      localStorage.setItem('apex_admin_token', data.data.token);

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle agent login (rank-based system)
  const handleAgentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First sign out any existing session
      await signOut();

      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError);
        setLoading(false);
        return;
      }

      // Wait a moment for auth context to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Manually fetch agent to check admin status
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('rank')
        .eq('user_id', currentUser.id)
        .single() as { data: { rank: string } | null; error: unknown };

      if (agentError || !agentData) {
        setError('Failed to verify admin access. Please try again.');
        setLoading(false);
        return;
      }

      const agentRank = agentData.rank as Rank;
      const isAdmin = RANK_CONFIG[agentRank]?.order >= RANK_CONFIG.regional_mga.order;

      if (isAdmin) {
        router.push('/admin');
      } else {
        setError('Access denied. Regional MGA or higher required.');
        await signOut();
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50">
        <CardHeader className="text-center">
          {/* Logo with white variant, proper aspect ratio and padding */}
          <div className="mx-auto mb-4 p-4">
            <div className="relative w-48 h-16">
              <Image
                src="/images/logo-w.png"
                alt="Apex Affinity Group"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-amber-500">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-white">Admin Portal</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Authorized personnel only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'corporate' | 'agent')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
              <TabsTrigger
                value="corporate"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Corporate Staff
              </TabsTrigger>
              <TabsTrigger
                value="agent"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Agent Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="corporate" className="mt-4">
              {/* Magic Link Sent Confirmation */}
              {corporateAuthMode === 'magic-link-sent' ? (
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
                    <p className="text-slate-400 text-sm">
                      We sent a sign-in link to<br />
                      <span className="text-white font-medium">{email}</span>
                    </p>
                  </div>
                  <div className="text-slate-500 text-xs space-y-1">
                    <p>The link expires in 15 minutes.</p>
                    <p>Check your spam folder if you don&apos;t see it.</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => {
                      setCorporateAuthMode('magic-link');
                      setEmail('');
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Try a different email
                  </Button>
                </div>
              ) : corporateAuthMode === 'magic-link' ? (
                /* Magic Link Form */
                <form onSubmit={handleMagicLinkRequest} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6 text-amber-500" />
                    </div>
                    <p className="text-slate-400 text-sm">
                      Enter your email to receive a secure sign-in link
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="magic-email" className="text-slate-300">Email</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="staff@theapexway.net"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Magic Link
                      </>
                    )}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-slate-800 px-2 text-slate-500">or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                    onClick={() => setCorporateAuthMode('password')}
                  >
                    Sign in with password instead
                  </Button>
                </form>
              ) : (
                /* Password Form (fallback) */
                <form onSubmit={handleCorporateLogin} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="corporate-email" className="text-slate-300">Email</Label>
                    <Input
                      id="corporate-email"
                      type="email"
                      placeholder="staff@theapexway.net"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="corporate-password" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="corporate-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                    onClick={() => setCorporateAuthMode('magic-link')}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Use magic link instead
                  </Button>
                </form>
              )}

              <p className="text-center text-xs text-slate-500 mt-4">
                For corporate employees (Finance, IT, Memberships, Training)
              </p>
            </TabsContent>

            <TabsContent value="agent" className="mt-4">
              <form onSubmit={handleAgentLogin} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="agent-email" className="text-slate-300">Email</Label>
                  <Input
                    id="agent-email"
                    type="email"
                    placeholder="agent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Input
                      id="agent-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Access Admin Panel'
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-4">
                For field agents (Regional MGA or higher)
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-center text-xs text-slate-500">
              Unauthorized access attempts are logged.
              <br />
              <Link href="/login" className="text-amber-500 hover:text-amber-400">
                Agent Portal Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
