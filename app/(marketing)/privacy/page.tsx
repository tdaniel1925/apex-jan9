/**
 * Privacy Policy Page (Main Site)
 * GDPR/CCPA compliant privacy disclosure
 */

import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Database, Mail, Lock, Globe, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Apex Affinity Group. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last Updated: January 2026
        </p>

        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Apex Affinity Group (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you visit our website, use our services, or interact with
              our independent agents.
            </p>
            <p>
              Please read this privacy policy carefully. By using our services, you consent
              to the data practices described in this policy.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Personal Information You Provide</h3>
              <p className="text-muted-foreground mb-3">
                When you register, apply, or contact us, we may collect:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Name, email address, phone number</li>
                <li>Mailing address and date of birth</li>
                <li>Social Security Number (for licensing and tax purposes)</li>
                <li>Banking information (for commission payments)</li>
                <li>Insurance licensing information</li>
                <li>Employment history and professional background</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Information Automatically Collected</h3>
              <p className="text-muted-foreground mb-3">
                When you visit our website, we automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>IP address and browser type</li>
                <li>Device information and operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Process your agent application and onboarding</li>
              <li>Facilitate insurance licensing and appointments</li>
              <li>Calculate and pay commissions and bonuses</li>
              <li>Provide access to our back-office systems</li>
              <li>Send important notices about your account</li>
              <li>Provide training and educational resources</li>
              <li>Communicate marketing and promotional offers (with consent)</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Prevent fraud and ensure security</li>
              <li>Improve our services and user experience</li>
            </ul>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Information Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may share your information with:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Insurance Carriers</h3>
                <p className="text-muted-foreground">
                  To facilitate licensing, appointments, and commission processing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Your Sponsor and Upline</h3>
                <p className="text-muted-foreground">
                  Limited information such as name, contact information, and production data
                  to support mentorship and team management.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Service Providers</h3>
                <p className="text-muted-foreground">
                  Third-party vendors who assist with payment processing, email services,
                  data analytics, and technology infrastructure.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Legal Requirements</h3>
                <p className="text-muted-foreground">
                  When required by law, court order, or regulatory authority.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground font-medium mt-4">
              We do NOT sell your personal information to third parties.
            </p>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational security measures to
              protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure access controls and authentication</li>
              <li>Regular security assessments and monitoring</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <p className="text-muted-foreground">
              While we strive to protect your information, no method of transmission over
              the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Depending on your location, you may have the following rights:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Access and Portability</h3>
                <p className="text-muted-foreground">
                  Request a copy of the personal information we hold about you.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Correction</h3>
                <p className="text-muted-foreground">
                  Request correction of inaccurate or incomplete information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Deletion</h3>
                <p className="text-muted-foreground">
                  Request deletion of your personal information, subject to legal
                  retention requirements.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Opt-Out</h3>
                <p className="text-muted-foreground">
                  Opt out of marketing communications at any time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">California Residents (CCPA)</h3>
                <p className="text-muted-foreground">
                  California residents have additional rights under the California Consumer
                  Privacy Act, including the right to know what information is collected and
                  the right to non-discrimination for exercising privacy rights.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4">
              To exercise any of these rights, contact us at privacy@theapexway.net.
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Remember your preferences and settings</li>
              <li>Authenticate your login sessions</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Track referrals and agent attributions</li>
            </ul>
            <p className="text-muted-foreground">
              You can control cookies through your browser settings. Disabling cookies
              may affect some website functionality.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Children&apos;s Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Our services are not directed to individuals under 18 years of age. We do not
              knowingly collect personal information from children. If you believe we have
              collected information from a child, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        {/* Changes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of
              any material changes by posting the new policy on this page and updating the
              &quot;Last Updated&quot; date. We encourage you to review this policy periodically.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our data practices:
            </p>
            <div className="text-muted-foreground">
              <p><strong>Email:</strong> privacy@theapexway.net</p>
              <p><strong>Mail:</strong> Apex Affinity Group, Attn: Privacy Officer, Dallas, TX</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
