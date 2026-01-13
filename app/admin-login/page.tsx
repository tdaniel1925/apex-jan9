'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertCircle, Loader2, Eye, EyeOff, Building2, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'corporate' | 'agent'>('corporate');
  const router = useRouter();
  const { signIn, signOut, agent, agentLoading } = useAuth();

  // Clear error when switching tabs
  useEffect(() => {
    setError(null);
  }, [loginType]);

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
              </form>

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
