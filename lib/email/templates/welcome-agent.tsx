/**
 * Welcome Agent Email Template
 * Sent when a new agent completes registration
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeAgentEmailProps {
  agentName: string;
  agentCode: string;
  sponsorName: string;
  replicatedSiteUrl: string;
  dashboardUrl: string;
  trainingUrl: string;
}

export function WelcomeAgentEmail({
  agentName = 'New Agent',
  agentCode = 'APX000000',
  sponsorName = 'Your Sponsor',
  replicatedSiteUrl = 'https://theapexway.net/join/APX000000',
  dashboardUrl = 'https://theapexway.net/dashboard',
  trainingUrl = 'https://theapexway.net/dashboard/training',
}: WelcomeAgentEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Apex Family, {agentName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={h1}>Welcome to the Apex Family!</Heading>
          </Section>

          <Text style={text}>Hi {agentName},</Text>

          <Text style={text}>
            Congratulations on taking the first step toward building your insurance career with
            <strong> Apex Affinity Group</strong>! We&apos;re thrilled to have you on board.
          </Text>

          <Text style={text}>
            Your sponsor, <strong>{sponsorName}</strong>, will be reaching out soon to help you
            get started. In the meantime, here&apos;s everything you need to begin your journey:
          </Text>

          {/* Replicated Site Section */}
          <Section style={highlightSection}>
            <Text style={highlightTitle}>Your Personal Recruiting Site is Live!</Text>
            <Text style={highlightText}>
              Share this link with prospects to start building your team:
            </Text>
            <Text style={siteUrl}>
              <Link href={replicatedSiteUrl} style={linkStyle}>
                {replicatedSiteUrl}
              </Link>
            </Text>
            <Text style={agentCodeText}>
              Your Agent Code: <strong>{agentCode}</strong>
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Next Steps */}
          <Heading style={h2}>Your Next Steps</Heading>

          <Section style={stepSection}>
            <Text style={stepNumber}>1</Text>
            <div>
              <Text style={stepTitle}>Complete Your Profile</Text>
              <Text style={stepText}>
                Add your photo and bio to personalize your recruiting site.
              </Text>
            </div>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>2</Text>
            <div>
              <Text style={stepTitle}>Start Your Training</Text>
              <Text style={stepText}>
                Our comprehensive onboarding program will teach you everything you need to know.
              </Text>
            </div>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>3</Text>
            <div>
              <Text style={stepTitle}>Get Licensed</Text>
              <Text style={stepText}>
                Your sponsor will guide you through the state licensing process.
              </Text>
            </div>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>4</Text>
            <div>
              <Text style={stepTitle}>Set Up Direct Deposit</Text>
              <Text style={stepText}>
                Add your banking info to receive your commission payments.
              </Text>
            </div>
          </Section>

          {/* CTA Buttons */}
          <Section style={buttonSection}>
            <Button style={primaryButton} href={dashboardUrl}>
              Go to Dashboard
            </Button>
            <Button style={secondaryButton} href={trainingUrl}>
              Start Training
            </Button>
          </Section>

          <Hr style={hr} />

          {/* What You Get */}
          <Heading style={h2}>What You Get as an Apex Agent</Heading>
          <Text style={text}>
            <strong>Access to 7 A-rated carriers</strong> - IUL, Term Life, Annuities, and more
            <br /><br />
            <strong>Up to 90% commission rates</strong> - Industry-leading compensation
            <br /><br />
            <strong>6 generations of overrides</strong> - Build passive income through your team
            <br /><br />
            <strong>AI-powered back office</strong> - Modern tools to manage your business
            <br /><br />
            <strong>Personal mentorship</strong> - Guidance from {sponsorName} and the team
          </Text>

          <Hr style={hr} />

          {/* Questions */}
          <Text style={text}>
            <strong>Questions?</strong> Reply to this email or contact your sponsor directly.
            We&apos;re here to help you succeed!
          </Text>

          <Text style={text}>
            Welcome aboard,
            <br />
            <strong>The Apex Affinity Group Team</strong>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Apex Affinity Group
            <br />
            Building Financial Freedom, One Family at a Time
            <br /><br />
            <Link href="https://theapexway.net" style={footerLink}>
              theapexway.net
            </Link>
            {' | '}
            <Link href="mailto:support@theapexway.net" style={footerLink}>
              support@theapexway.net
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeAgentEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const headerSection = {
  backgroundColor: '#0ea5e9',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '32px 40px 16px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const highlightSection = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  border: '1px solid #10b981',
  margin: '32px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const highlightTitle = {
  color: '#047857',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const highlightText = {
  color: '#333',
  fontSize: '14px',
  margin: '0 0 16px',
};

const siteUrl = {
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  padding: '12px',
  margin: '0 0 12px',
  wordBreak: 'break-all' as const,
};

const linkStyle = {
  color: '#0ea5e9',
  fontSize: '14px',
  fontWeight: 'bold',
};

const agentCodeText = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const stepSection = {
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
  margin: '16px 40px',
  padding: '0',
};

const stepNumber = {
  backgroundColor: '#0ea5e9',
  borderRadius: '50%',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  width: '28px',
  height: '28px',
  lineHeight: '28px',
  textAlign: 'center' as const,
  margin: '0 12px 0 0',
  flexShrink: 0,
};

const stepTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const stepText = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
  lineHeight: '20px',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 40px',
};

const primaryButton = {
  backgroundColor: '#0ea5e9',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 8px 8px 0',
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: '2px solid #0ea5e9',
  color: '#0ea5e9',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 24px',
  margin: '0 0 8px 8px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};
