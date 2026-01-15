/**
 * Privacy Policy Page
 * GDPR/CCPA compliant privacy disclosure for MLM replicated sites
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Database, Mail, Lock, Globe, UserCheck } from 'lucide-react';

interface PageProps {
  params: Promise<{ username: string }>;
}

// Type for agent name query
interface AgentNameResult {
  first_name: string;
  last_name: string;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('username', username.toLowerCase())
    .single();

  const agent = agentData as AgentNameResult | null;
  const agentName = agent ? `${agent.first_name} ${agent.last_name}` : 'Agent';

  return {
    title: 'Privacy Policy',
    description: `Privacy Policy for ${agentName}'s team at Apex Affinity Group. Learn how we collect, use, and protect your personal information.`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { username } = await params;
  const t = await getTranslations('replicated.privacy');

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('lastUpdated')}
        </p>

        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('introduction.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              {t('introduction.content1')}
            </p>
            <p>
              {t('introduction.content2')}
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('collect.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">{t('collect.personal.title')}</h3>
              <p className="text-muted-foreground mb-3">
                {t('collect.personal.intro')}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('collect.personal.items.contact')}</li>
                <li>{t('collect.personal.items.address')}</li>
                <li>{t('collect.personal.items.ssn')}</li>
                <li>{t('collect.personal.items.banking')}</li>
                <li>{t('collect.personal.items.license')}</li>
                <li>{t('collect.personal.items.employment')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('collect.automatic.title')}</h3>
              <p className="text-muted-foreground mb-3">
                {t('collect.automatic.intro')}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('collect.automatic.items.ip')}</li>
                <li>{t('collect.automatic.items.device')}</li>
                <li>{t('collect.automatic.items.pages')}</li>
                <li>{t('collect.automatic.items.referrer')}</li>
                <li>{t('collect.automatic.items.cookies')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('use.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t('use.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>{t('use.items.application')}</li>
              <li>{t('use.items.licensing')}</li>
              <li>{t('use.items.commissions')}</li>
              <li>{t('use.items.access')}</li>
              <li>{t('use.items.notices')}</li>
              <li>{t('use.items.training')}</li>
              <li>{t('use.items.marketing')}</li>
              <li>{t('use.items.legal')}</li>
              <li>{t('use.items.fraud')}</li>
              <li>{t('use.items.improve')}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('sharing.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('sharing.intro')}
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('sharing.carriers.title')}</h3>
                <p className="text-muted-foreground">
                  {t('sharing.carriers.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('sharing.sponsor.title')}</h3>
                <p className="text-muted-foreground">
                  {t('sharing.sponsor.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('sharing.providers.title')}</h3>
                <p className="text-muted-foreground">
                  {t('sharing.providers.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('sharing.legal.title')}</h3>
                <p className="text-muted-foreground">
                  {t('sharing.legal.description')}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground font-medium mt-4">
              {t('sharing.noSell')}
            </p>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('security.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('security.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>{t('security.items.encryption')}</li>
              <li>{t('security.items.access')}</li>
              <li>{t('security.items.assessments')}</li>
              <li>{t('security.items.training')}</li>
              <li>{t('security.items.incident')}</li>
            </ul>
            <p className="text-muted-foreground">
              {t('security.disclaimer')}
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {t('rights.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('rights.intro')}
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('rights.access.title')}</h3>
                <p className="text-muted-foreground">
                  {t('rights.access.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('rights.correction.title')}</h3>
                <p className="text-muted-foreground">
                  {t('rights.correction.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('rights.deletion.title')}</h3>
                <p className="text-muted-foreground">
                  {t('rights.deletion.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('rights.optOut.title')}</h3>
                <p className="text-muted-foreground">
                  {t('rights.optOut.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('rights.ccpa.title')}</h3>
                <p className="text-muted-foreground">
                  {t('rights.ccpa.description')}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mt-4">
              {t('rights.contact')}
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('cookies.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('cookies.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>{t('cookies.items.preferences')}</li>
              <li>{t('cookies.items.auth')}</li>
              <li>{t('cookies.items.analytics')}</li>
              <li>{t('cookies.items.tracking')}</li>
            </ul>
            <p className="text-muted-foreground">
              {t('cookies.control')}
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('children.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('children.content')}
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('changes.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('changes.content')}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('contact.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              {t('contact.intro')}
            </p>
            <div className="text-muted-foreground">
              <p>{t('contact.email')}</p>
              <p>{t('contact.mail')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>
            {t('footer')}
          </p>
        </div>
      </div>
    </div>
  );
}
