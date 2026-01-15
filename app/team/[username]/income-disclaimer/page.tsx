/**
 * Income Disclaimer Page
 * FTC-compliant earnings disclosure for MLM/network marketing
 * Following CodeBakers patterns from 00-core.md
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react';

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
    title: 'Income Disclaimer',
    description: `Important earnings disclosure and income disclaimer for ${agentName}'s team at Apex Affinity Group.`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function IncomeDisclaimerPage({ params }: PageProps) {
  const { username } = await params;
  const t = await getTranslations('replicated.incomeDisclaimer');

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('lastUpdated')}
        </p>

        {/* Important Notice */}
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('importantNotice.title')}</AlertTitle>
          <AlertDescription>
            {t('importantNotice.description')}
          </AlertDescription>
        </Alert>

        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('overview.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              {t('overview.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('overview.items.effort')}</li>
              <li>{t('overview.items.skills')}</li>
              <li>{t('overview.items.market')}</li>
              <li>{t('overview.items.licensing')}</li>
              <li>{t('overview.items.relationships')}</li>
              <li>{t('overview.items.leadership')}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Income Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('statistics.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              {t('statistics.intro')}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t('statistics.headers.rank')}</th>
                    <th className="text-right py-3 px-4">{t('statistics.headers.percentage')}</th>
                    <th className="text-right py-3 px-4">{t('statistics.headers.avgIncome')}</th>
                    <th className="text-right py-3 px-4">{t('statistics.headers.range')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">Pre-Associate</td>
                    <td className="text-right py-3 px-4">45%</td>
                    <td className="text-right py-3 px-4">$0 - $500</td>
                    <td className="text-right py-3 px-4">$0 - $2,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Associate</td>
                    <td className="text-right py-3 px-4">25%</td>
                    <td className="text-right py-3 px-4">$2,500</td>
                    <td className="text-right py-3 px-4">$500 - $10,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Senior Associate</td>
                    <td className="text-right py-3 px-4">15%</td>
                    <td className="text-right py-3 px-4">$12,000</td>
                    <td className="text-right py-3 px-4">$5,000 - $35,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">District Manager</td>
                    <td className="text-right py-3 px-4">8%</td>
                    <td className="text-right py-3 px-4">$45,000</td>
                    <td className="text-right py-3 px-4">$20,000 - $85,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Regional Manager</td>
                    <td className="text-right py-3 px-4">4%</td>
                    <td className="text-right py-3 px-4">$95,000</td>
                    <td className="text-right py-3 px-4">$50,000 - $175,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Senior Regional</td>
                    <td className="text-right py-3 px-4">2%</td>
                    <td className="text-right py-3 px-4">$175,000</td>
                    <td className="text-right py-3 px-4">$100,000 - $350,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">MGA</td>
                    <td className="text-right py-3 px-4">0.8%</td>
                    <td className="text-right py-3 px-4">$325,000</td>
                    <td className="text-right py-3 px-4">$200,000 - $600,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Premier MGA</td>
                    <td className="text-right py-3 px-4">0.2%</td>
                    <td className="text-right py-3 px-4">$750,000+</td>
                    <td className="text-right py-3 px-4">$400,000 - $2,000,000+</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('statistics.footnote')}
            </p>
          </CardContent>
        </Card>

        {/* Key Disclosures */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('disclosures.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('disclosures.noGuarantee.title')}</h3>
                <p className="text-muted-foreground">
                  {t('disclosures.noGuarantee.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('disclosures.majority.title')}</h3>
                <p className="text-muted-foreground">
                  {t('disclosures.majority.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('disclosures.work.title')}</h3>
                <p className="text-muted-foreground">
                  {t('disclosures.work.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('disclosures.expenses.title')}</h3>
                <p className="text-muted-foreground">
                  {t('disclosures.expenses.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('disclosures.licensing.title')}</h3>
                <p className="text-muted-foreground">
                  {t('disclosures.licensing.description')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('disclosures.commission.title')}</h3>
                <p className="text-muted-foreground">
                  {t('disclosures.commission.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Statement */}
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">{t('legal.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('legal.content1')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('legal.content2')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('legal.content3')}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {t('contact.intro')}
          </p>
          <p>
            {t('contact.email')}
          </p>
        </div>
      </div>
    </div>
  );
}
