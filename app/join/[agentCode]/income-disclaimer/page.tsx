/**
 * Income Disclaimer Page
 * FTC-compliant earnings disclosure for MLM/network marketing
 * Following CodeBakers patterns from 00-core.md
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react';

interface PageProps {
  params: Promise<{ agentCode: string }>;
}

// Type for agent name query
interface AgentNameResult {
  first_name: string;
  last_name: string;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { agentCode } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('agent_code', agentCode)
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
  const { agentCode } = await params;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Income Disclosure Statement</h1>
        <p className="text-muted-foreground mb-8">
          Last Updated: January 2026
        </p>

        {/* Important Notice */}
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            This income disclosure statement is required by the Federal Trade Commission (FTC)
            and is designed to provide you with accurate information about the earnings of
            Apex Affinity Group independent agents.
          </AlertDescription>
        </Alert>

        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Earnings Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The earnings of Apex Affinity Group independent agents vary significantly.
              The amount of money an agent earns depends on many factors, including but
              not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Individual effort and time committed to the business</li>
              <li>Sales skills and experience</li>
              <li>Market conditions in your geographic area</li>
              <li>Licensing status and product knowledge</li>
              <li>Quality of customer relationships</li>
              <li>Leadership and team-building abilities</li>
            </ul>
          </CardContent>
        </Card>

        {/* Income Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Income Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              The following table shows the percentage of agents at each rank and their
              average annual earnings for the most recent fiscal year:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-right py-3 px-4">% of Agents</th>
                    <th className="text-right py-3 px-4">Avg. Annual Income</th>
                    <th className="text-right py-3 px-4">Range</th>
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
              * These figures represent gross commissions before taxes and business expenses.
              Individual results will vary.
            </p>
          </CardContent>
        </Card>

        {/* Key Disclosures */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Key Disclosures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">No Guaranteed Income</h3>
                <p className="text-muted-foreground">
                  Apex Affinity Group does not guarantee any specific level of income or success.
                  Your income depends entirely on your own efforts, skills, and dedication to
                  building your business.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Majority Earn Little or Nothing</h3>
                <p className="text-muted-foreground">
                  A significant majority of individuals who join the opportunity earn little
                  to no income. Approximately 70% of agents earn less than $10,000 per year,
                  and many earn nothing at all.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Income Requires Work</h3>
                <p className="text-muted-foreground">
                  Income from Apex Affinity Group requires significant time, effort, and
                  dedication. Success is not automatic and requires active engagement in
                  sales, team building, and ongoing training.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Business Expenses</h3>
                <p className="text-muted-foreground">
                  All agents are responsible for their own business expenses, including
                  licensing fees, continuing education, marketing costs, and technology
                  expenses. These costs reduce your net income.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Licensing Requirements</h3>
                <p className="text-muted-foreground">
                  To sell insurance products, you must obtain and maintain appropriate
                  state licenses. Licensing requirements, costs, and time vary by state.
                  You cannot earn commissions until you are properly licensed.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Commission Structure</h3>
                <p className="text-muted-foreground">
                  Commissions are paid based on actual insurance product sales. Override
                  commissions are paid on the production of agents in your downline.
                  Commission rates vary by product and rank level.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Statement */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Legal Statement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This income disclosure statement is provided in compliance with FTC guidelines
              for business opportunity disclosures. The income figures presented represent
              actual results from the most recent complete fiscal year.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Apex Affinity Group is not a &quot;get rich quick&quot; scheme. Building a
              successful insurance agency requires substantial time, effort, skill development,
              and persistence. Many people who join do not make any money, and some may
              lose money due to business expenses.
            </p>
            <p className="text-sm text-muted-foreground">
              Before making any decision to join, you should carefully review this income
              disclosure, speak with your financial advisor, and consider whether this
              opportunity is appropriate for your personal and financial situation.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Questions about this income disclosure?
          </p>
          <p>
            Contact: compliance@apexaffinity.com
          </p>
        </div>
      </div>
    </div>
  );
}
