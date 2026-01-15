/**
 * Terms of Service Page
 * Legal terms and conditions for MLM replicated sites
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, AlertTriangle, Scale, Ban, RefreshCw, Gavel } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    title: 'Terms of Service',
    description: `Terms of Service for ${agentName}'s team at Apex Affinity Group. Read our terms and conditions for becoming an independent agent.`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function TermsOfServicePage({ params }: PageProps) {
  const { username } = await params;
  const t = await getTranslations('replicated.terms');

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('lastUpdated')}
        </p>

        {/* Important Notice */}
        <Alert className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('importantNotice.title')}</AlertTitle>
          <AlertDescription>
            {t('importantNotice.description')}
          </AlertDescription>
        </Alert>

        {/* Agreement */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('agreement.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('agreement.content1')}
            </p>
            <p className="text-muted-foreground">
              {t('agreement.content2')}
            </p>
          </CardContent>
        </Card>

        {/* Independent Contractor Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('contractor.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              <strong>{t('contractor.intro')}</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>{t('contractor.items.control')}</li>
              <li>{t('contractor.items.taxes')}</li>
              <li>{t('contractor.items.benefits')}</li>
              <li>{t('contractor.items.licenses')}</li>
              <li>{t('contractor.items.represent')}</li>
              <li>{t('contractor.items.noGuarantee')}</li>
            </ul>
            <p className="text-muted-foreground">
              {t('contractor.agreement')}
            </p>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('eligibility.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('eligibility.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>{t('eligibility.items.age')}</li>
              <li>{t('eligibility.items.authorized')}</li>
              <li>{t('eligibility.items.background')}</li>
              <li>{t('eligibility.items.license')}</li>
              <li>{t('eligibility.items.training')}</li>
              <li>{t('eligibility.items.truthful')}</li>
              <li>{t('eligibility.items.noFelony')}</li>
            </ul>
            <p className="text-muted-foreground">
              {t('eligibility.reserve')}
            </p>
          </CardContent>
        </Card>

        {/* Commission and Compensation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              {t('compensation.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('compensation.intro')}
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('compensation.structure.title')}</h3>
                <p className="text-muted-foreground">
                  {t('compensation.structure.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('compensation.chargebacks.title')}</h3>
                <p className="text-muted-foreground">
                  {t('compensation.chargebacks.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('compensation.schedule.title')}</h3>
                <p className="text-muted-foreground">
                  {t('compensation.schedule.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('compensation.minimum.title')}</h3>
                <p className="text-muted-foreground">
                  {t('compensation.minimum.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code of Conduct */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              {t('conduct.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('conduct.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>{t('conduct.items.honesty')}</li>
              <li>{t('conduct.items.comply')}</li>
              <li>{t('conduct.items.noClaims')}</li>
              <li>{t('conduct.items.accurate')}</li>
              <li>{t('conduct.items.protect')}</li>
              <li>{t('conduct.items.noRebating')}</li>
              <li>{t('conduct.items.noRecruit')}</li>
              <li>{t('conduct.items.professional')}</li>
            </ul>

            <p className="text-muted-foreground font-medium mt-4">
              {t('conduct.violations')}
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              {t('termination.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{t('termination.voluntary.title')}</h3>
              <p className="text-muted-foreground">
                {t('termination.voluntary.description')}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('termination.cause.title')}</h3>
              <p className="text-muted-foreground">
                {t('termination.cause.intro')}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('termination.cause.items.violation')}</li>
                <li>{t('termination.cause.items.fraud')}</li>
                <li>{t('termination.cause.items.license')}</li>
                <li>{t('termination.cause.items.production')}</li>
                <li>{t('termination.cause.items.reputation')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('termination.effect.title')}</h3>
              <p className="text-muted-foreground">
                {t('termination.effect.description')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('ip.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('ip.content1')}
            </p>
            <p className="text-muted-foreground">
              {t('ip.content2')}
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              {t('liability.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('liability.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>{t('liability.items.asIs')}</li>
              <li>{t('liability.items.noIndirect')}</li>
              <li>{t('liability.items.limited')}</li>
              <li>{t('liability.items.thirdParty')}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('disputes.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('disputes.content')}
            </p>
            <p className="text-muted-foreground">
              <strong>{t('disputes.classAction')}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('modifications.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('modifications.content')}
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('governing.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('governing.content')}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('contact.title')}</CardTitle>
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
        <div className="text-center text-sm text-muted-foreground mt-8 space-y-2">
          <p>
            {t('footer.acknowledgment')}
          </p>
          <p>
            {t('footer.incomeLink')}{' '}
            <a href={`/team/${username}/income-disclaimer`} className="text-primary hover:underline">
              Income Disclosure Statement
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
