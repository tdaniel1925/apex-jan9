'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Agent } from '@/lib/types/database';
import { RANK_CONFIG } from '@/lib/config/ranks';
import {
  CheckCircle,
  PartyPopper,
  ExternalLink,
  BookOpen,
  Users,
  Wallet,
  Copy,
  Check,
} from 'lucide-react';

export default function SignupSuccessPage() {
  const params = useParams();
  const username = params.username as string;

  const [currentUser, setCurrentUser] = useState<Agent | null>(null);
  const [sponsor, setSponsor] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Get current logged in user's agent profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (agentData) {
          setCurrentUser(agentData as Agent);
        }
      }

      // Get sponsor's data for display
      const { data: sponsorData } = await supabase
        .from('agents')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (sponsorData) {
        setSponsor(sponsorData as Agent);
      }

      setLoading(false);
    };

    fetchData();
  }, [username]);

  const copyReplicatedSiteUrl = () => {
    // Use username if available, fall back to agent_code for backward compatibility
    const siteId = currentUser?.username || currentUser?.agent_code;
    const pathPrefix = currentUser?.username ? 'team' : 'join';
    if (siteId) {
      const url = `${window.location.origin}/${pathPrefix}/${siteId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
  // Use username if available, fall back to agent_code for backward compatibility
  const userSiteId = currentUser?.username || currentUser?.agent_code;
  const userPathPrefix = currentUser?.username ? 'team' : 'join';

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <PartyPopper className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome to the Apex Family!
          </h1>
          <p className="text-xl text-muted-foreground">
            Congratulations, {currentUser?.first_name}! Your account has been created successfully.
          </p>
        </div>

        {/* Sponsor Acknowledgment */}
        {sponsor && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={sponsor.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {sponsor.first_name[0]}{sponsor.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Your Sponsor</p>
                  <p className="text-lg font-semibold">
                    {sponsor.first_name} {sponsor.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sponsorRankConfig?.name}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {sponsor.first_name} will be your mentor and guide as you start your journey.
                They&apos;ll reach out soon to help you get started!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Your Replicated Site */}
        {userSiteId && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Your Personal Recruiting Site is Live!
              </CardTitle>
              <CardDescription className="text-green-700">
                Share this link with prospects to start building your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <code className="flex-1 text-sm text-green-800 truncate">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/${userPathPrefix}/${userSiteId}`
                    : `/${userPathPrefix}/${userSiteId}`
                  }
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyReplicatedSiteUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${userPathPrefix}/${userSiteId}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Your Site
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Next Steps</CardTitle>
            <CardDescription>
              Complete these steps to get started on the right foot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Complete Your Profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Add your photo and bio to personalize your recruiting site
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/settings">
                    Go
                  </Link>
                </Button>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Start Onboarding Training
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Learn the essentials with our comprehensive training program
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/training">
                    Start
                  </Link>
                </Button>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Get Licensed
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Your sponsor will guide you through the licensing process
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Set Up Direct Deposit
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Add your banking info to receive commission payments
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/wallet">
                    Set Up
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="px-8">
            <Link href="/dashboard">
              Go to Your Dashboard
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Check your email for a welcome message with more details
          </p>
        </div>
      </div>
    </div>
  );
}
