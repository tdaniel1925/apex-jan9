/**
 * Terms of Service Page
 * Legal terms and conditions for MLM replicated sites
 * Following CodeBakers patterns from 00-core.md
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, AlertTriangle, Scale, Ban, RefreshCw, Gavel } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    title: 'Terms of Service',
    description: `Terms of Service for ${agentName}'s team at Apex Affinity Group. Read our terms and conditions for becoming an independent agent.`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function TermsOfServicePage({ params }: PageProps) {
  const { agentCode } = await params;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last Updated: January 2026
        </p>

        {/* Important Notice */}
        <Alert className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Legal Agreement</AlertTitle>
          <AlertDescription>
            Please read these terms carefully before using our services or applying to become
            an independent agent. By using our website or services, you agree to be bound by
            these terms.
          </AlertDescription>
        </Alert>

        {/* Agreement */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Agreement to Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between
              you and Apex Affinity Group (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your
              use of our website, services, and agent opportunity.
            </p>
            <p className="text-muted-foreground">
              By accessing our website, submitting an application, or participating in our
              agent program, you acknowledge that you have read, understood, and agree to be
              bound by these Terms.
            </p>
          </CardContent>
        </Card>

        {/* Independent Contractor Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Independent Contractor Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              <strong>You are an independent contractor, NOT an employee.</strong> This means:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You control your own hours, methods, and business practices</li>
              <li>You are responsible for your own taxes, including self-employment tax</li>
              <li>You are not entitled to employee benefits (health insurance, 401k, etc.)</li>
              <li>You must obtain and maintain required insurance licenses at your own expense</li>
              <li>You may represent other companies, subject to carrier appointment rules</li>
              <li>We do not guarantee any minimum income or success</li>
            </ul>
            <p className="text-muted-foreground">
              You agree to sign an Independent Contractor Agreement as part of your onboarding,
              which provides additional details about this relationship.
            </p>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Eligibility Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To become an Apex Affinity Group agent, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Be at least 18 years of age</li>
              <li>Be legally authorized to work in the United States</li>
              <li>Pass a background check (required by insurance carriers)</li>
              <li>Obtain required state insurance licenses</li>
              <li>Complete our onboarding training program</li>
              <li>Provide accurate and truthful information on your application</li>
              <li>Have no felony convictions related to financial crimes</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to reject any application or terminate any agent
              relationship at our discretion.
            </p>
          </CardContent>
        </Card>

        {/* Commission and Compensation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Compensation and Commissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your compensation is based solely on commissions from insurance products you sell
              and overrides from your team&apos;s production. Key terms include:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Commission Structure</h3>
                <p className="text-muted-foreground">
                  Commission rates vary by product and your current rank level. See our
                  Compensation Plan document for current rates.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Chargebacks</h3>
                <p className="text-muted-foreground">
                  If a policy lapses or is cancelled within the chargeback period (typically
                  6-12 months depending on carrier), commissions may be recovered from future
                  earnings or your account balance.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Payment Schedule</h3>
                <p className="text-muted-foreground">
                  Commissions are paid according to our published payment schedule, typically
                  weekly or bi-weekly, subject to carrier payment receipt.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Minimum Payout</h3>
                <p className="text-muted-foreground">
                  A minimum balance may be required before payout. Amounts below the minimum
                  will carry forward to the next pay period.
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
              Code of Conduct
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              As an Apex agent, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Act with honesty and integrity in all business dealings</li>
              <li>Comply with all applicable laws, regulations, and carrier guidelines</li>
              <li>Never make misleading income claims or guarantees to prospects</li>
              <li>Accurately represent products and their benefits</li>
              <li>Protect client confidential information</li>
              <li>Not engage in rebating, twisting, or other prohibited practices</li>
              <li>Not recruit agents from other Apex teams without permission</li>
              <li>Maintain professional conduct on social media</li>
            </ul>

            <p className="text-muted-foreground font-medium mt-4">
              Violations may result in termination, commission forfeiture, and legal action.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Termination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Voluntary Termination</h3>
              <p className="text-muted-foreground">
                You may terminate your agent relationship at any time by providing written
                notice. Pending commissions will be paid according to normal schedule, subject
                to chargebacks.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Termination for Cause</h3>
              <p className="text-muted-foreground">
                We may terminate your relationship immediately for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Violation of these Terms or Code of Conduct</li>
                <li>Fraudulent activity or misrepresentation</li>
                <li>Loss of required licenses</li>
                <li>Failure to meet minimum production requirements</li>
                <li>Actions that harm the company&apos;s reputation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Effect of Termination</h3>
              <p className="text-muted-foreground">
                Upon termination, your access to our systems will be revoked, your replicated
                website will be deactivated, and you will no longer represent yourself as an
                Apex agent.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All trademarks, logos, content, and materials on our website are owned by
              Apex Affinity Group or our licensors. You are granted a limited, non-exclusive
              license to use approved marketing materials during your active agent status.
            </p>
            <p className="text-muted-foreground">
              You may not modify, reproduce, or distribute our materials without written
              permission. Your replicated website license is non-transferable and terminates
              when your agent status ends.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                We provide services &quot;as is&quot; without warranties of any kind
              </li>
              <li>
                We are not liable for indirect, incidental, or consequential damages
              </li>
              <li>
                Our total liability is limited to commissions actually paid to you in the
                preceding 12 months
              </li>
              <li>
                We are not responsible for actions of insurance carriers or third parties
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Any disputes arising from these Terms or your agent relationship shall be
              resolved through binding arbitration in accordance with the American Arbitration
              Association rules. Arbitration will take place in the state where the Company
              is headquartered.
            </p>
            <p className="text-muted-foreground">
              <strong>Class Action Waiver:</strong> You agree to resolve disputes individually
              and waive any right to participate in class action lawsuits.
            </p>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Modifications to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. Material changes will
              be communicated via email or through our agent portal. Continued use of our
              services after changes constitutes acceptance of the modified Terms.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of
              the State of Texas, without regard to conflict of law principles.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              Questions about these Terms? Contact us:
            </p>
            <div className="text-muted-foreground">
              <p><strong>Email:</strong> legal@theapexway.net</p>
              <p><strong>Mail:</strong> Apex Affinity Group, Attn: Legal Department</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-8 space-y-2">
          <p>
            By using our services, you acknowledge that you have read and understood these
            Terms of Service and agree to be bound by them.
          </p>
          <p>
            For income-related disclosures, please review our{' '}
            <a href={`/join/${agentCode}/income-disclaimer`} className="text-primary hover:underline">
              Income Disclosure Statement
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
