'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Agent } from '@/lib/types/database';
import { RANK_CONFIG } from '@/lib/config/ranks';
import { Mail, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentCode = params.agentCode as string;
  const email = searchParams.get('email') || '';

  const [sponsor, setSponsor] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsor = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_code', agentCode)
        .single();

      if (data) {
        setSponsor(data as Agent);
      }
      setLoading(false);
    };

    fetchSponsor();
  }, [agentCode]);

  const handleResendEmail = async () => {
    if (!email) return;

    setResending(true);
    setError(null);

    try {
      const supabase = createClient();
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/join/${agentCode}/signup/success`,
        },
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch {
      setError('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const sponsorRankConfig = sponsor ? RANK_CONFIG[sponsor.rank] : null;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent a verification link to
            </CardDescription>
            {email && (
              <p className="mt-2 font-semibold text-foreground">{email}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm">
                  Click the verification link in your email to activate your account
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm">
                  Check your spam folder if you don&apos;t see it within a few minutes
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm">
                  The link expires in 24 hours
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Resend button */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email?
              </p>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resending || resent}
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    Email Sent!
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Email
                  </>
                )}
              </Button>
            </div>

            {/* Sponsor info */}
            {sponsor && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  You&apos;re joining
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={sponsor.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {sponsor.first_name[0]}{sponsor.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {sponsor.first_name} {sponsor.last_name}&apos;s Team
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sponsorRankConfig?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Back link */}
            <div className="text-center pt-2">
              <Link
                href={`/join/${agentCode}/signup`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to signup
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
