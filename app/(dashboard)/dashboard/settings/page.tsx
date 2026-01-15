'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Sparkles, Shield, Bell, Key, Loader2, Copy, Check, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { toast } from 'sonner';

export default function SettingsPage() {
  const t = useTranslations('settings');
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
      toast.success(t('profileUpdated'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('failedSaveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyReferralLink = async () => {
    const link = `${window.location.origin}/join/${agent?.agent_code || ''}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('failedCopyLink'));
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
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('profileInfo')}
          </CardTitle>
          <CardDescription>{t('updatePersonalInfo')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload
            currentUrl={agent?.avatar_url}
            initials={`${agent?.first_name?.[0] || ''}${agent?.last_name?.[0] || ''}`}
            onUploadComplete={(url) => setAgent({ ...agent, avatar_url: url })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('firstName')}</Label>
              <Input
                id="firstName"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('lastName')}</Label>
              <Input
                id="lastName"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" defaultValue={agent?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
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
            {t('saveChanges')}
          </Button>
        </CardContent>
      </Card>

      {/* AI Copilot Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('aiCopilot')}
          </CardTitle>
          <CardDescription>{t('manageAiSubscription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{t('currentPlan')}</p>
                <Badge variant={agent?.ai_copilot_tier === 'none' ? 'secondary' : 'default'}>
                  {agent?.ai_copilot_tier === 'none' ? t('notSubscribed') :
                   agent?.ai_copilot_tier === 'basic' ? t('basicPlan') :
                   agent?.ai_copilot_tier === 'pro' ? t('proPlan') :
                   t('agencyPlan')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {agent?.ai_copilot_tier === 'none'
                  ? t('getAiAssistance')
                  : t('aiAssistantActive')}
              </p>
            </div>
            <Link href="/copilot/subscribe">
              <Button variant={agent?.ai_copilot_tier === 'none' ? 'default' : 'outline'}>
                {agent?.ai_copilot_tier === 'none' ? t('subscribe') : t('managePlan')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Banking Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Banking Information
          </CardTitle>
          <CardDescription>Manage your bank account for withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-semibold">Payment Details</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add or update your bank account to receive withdrawals
              </p>
            </div>
            <Link href="/dashboard/settings/banking">
              <Button variant="outline">
                Manage
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
            {t('security')}
          </CardTitle>
          <CardDescription>{t('manageAccountSecurity')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('password')}</p>
                <p className="text-sm text-muted-foreground">{t('changeAccountPassword')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => toast.info(t('passwordChangeEmail'))}
            >
              {t('change')}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('twoFactorAuth')}</p>
                <p className="text-sm text-muted-foreground">{t('addExtraSecurity')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => toast.info(t('twoFactorComingSoon'))}
            >
              {t('enable')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications')}
          </CardTitle>
          <CardDescription>{t('manageNotifications')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">{t('emailNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('emailNotifDesc')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info(t('emailNotifComingSoon'))}
            >
              {t('configure')}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">{t('pushNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('pushNotifDesc')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info(t('pushNotifComingSoon'))}
            >
              {t('configure')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>{t('yourReferralLink')}</CardTitle>
          <CardDescription>{t('shareToRecruit')}</CardDescription>
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
