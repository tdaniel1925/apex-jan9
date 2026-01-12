'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, signOut, agent, agentLoading } = useAuth();

  // Force logout on page load - admin access requires fresh authentication
  useEffect(() => {
    const forceLogout = async () => {
      if (!agentLoading && agent) {
        await signOut();
      }
    };
    forceLogout();
  }, []); // Run once on mount, not when agent changes

  // After successful login, check admin privileges and redirect
  useEffect(() => {
    if (!agentLoading && agent && loading) {
      const agentRank = agent.rank as Rank;
      const isAdmin = RANK_CONFIG[agentRank]?.order >= RANK_CONFIG.regional_mga.order;

      if (isAdmin) {
        router.push('/admin');
      } else {
        // Not an admin - middleware will redirect to dashboard
        setError('Access denied. Regional MGA or higher required.');
        setLoading(false);
      }
    }
  }, [agent, agentLoading, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
        .single() as { data: { rank: string } | null; error: any };

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
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@apexaffinity.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-center text-xs text-slate-500">
              Admin access is restricted to Regional MGA and above.
              <br />
              Unauthorized access attempts are logged.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
