'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Sparkles, Shield, Bell, Key, Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const supabase = createClient();

      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const agent = agentData as { first_name?: string; last_name?: string; phone?: string; [key: string]: unknown } | null;
      setAgent(agent);
      if (agent) {
        setFormData({
          first_name: agent.first_name || '',
          last_name: agent.last_name || '',
          phone: agent.phone || '',
        });
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!agent?.id) return;
    setSaving(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('agents') as any)
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        })
        .eq('id', agent.id);

      if (error) throw error;
      setAgent({ ...agent, ...formData });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyReferralLink = async () => {
    const link = `${window.location.origin}/join/${agent?.agent_code || ''}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Referral link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload
            currentUrl={agent?.avatar_url}
            initials={`${agent?.first_name?.[0] || ''}${agent?.last_name?.[0] || ''}`}
            onUploadComplete={(url) => setAgent({ ...agent, avatar_url: url })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={agent?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* AI Copilot Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Copilot
          </CardTitle>
          <CardDescription>Manage your AI assistant subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Current Plan</p>
                <Badge variant={agent?.ai_copilot_tier === 'none' ? 'secondary' : 'default'}>
                  {agent?.ai_copilot_tier === 'none' ? 'Not Subscribed' :
                   agent?.ai_copilot_tier === 'basic' ? 'Basic - $49/mo' :
                   agent?.ai_copilot_tier === 'pro' ? 'Pro - $99/mo' :
                   'Agency - $199/mo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {agent?.ai_copilot_tier === 'none'
                  ? 'Get AI-powered assistance for sales and recruiting'
                  : 'Your AI assistant is active and ready to help'}
              </p>
            </div>
            <Link href="/copilot/subscribe">
              <Button variant={agent?.ai_copilot_tier === 'none' ? 'default' : 'outline'}>
                {agent?.ai_copilot_tier === 'none' ? 'Subscribe' : 'Manage Plan'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Change your account password</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => toast.info('Password change will be sent to your email')}
            >
              Change
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => toast.info('Two-factor authentication setup coming soon')}
            >
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Email notification settings coming soon')}
            >
              Configure
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive browser notifications</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Push notification settings coming soon')}
            >
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link to recruit new agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://apex.com'}/join/${agent?.agent_code || ''}`}
              className="font-mono"
            />
            <Button variant="outline" onClick={handleCopyReferralLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
