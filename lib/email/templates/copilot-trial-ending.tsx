/**
 * Copilot Trial Ending Email Template
 * Notifies agent when their trial is about to expire
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface CopilotTrialEndingEmailProps {
  agentName: string;
  daysRemaining: number;
  trialEndDate: string;
  upgradeUrl: string;
}

export function CopilotTrialEndingEmail({
  agentName = 'Agent',
  daysRemaining = 3,
  trialEndDate = 'January 15, 2026',
  upgradeUrl = 'https://apexaffinity.com/copilot/subscribe',
}: CopilotTrialEndingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your AI Copilot trial ends in ${daysRemaining} days`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Trial is Ending Soon</Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            Your AI Copilot free trial ends in <strong>{daysRemaining} days</strong> (on {trialEndDate}).
          </Text>

          <Section style={warningSection}>
            <Text style={warningText}>
              After your trial ends, your widget will stop responding to visitors.
            </Text>
          </Section>

          <Text style={text}>
            Don&apos;t miss out on the leads your AI assistant is capturing! Upgrade now to keep
            your copilot running without interruption.
          </Text>

          <Section style={benefitsSection}>
            <Text style={benefitsTitle}>What you&apos;ll keep with a subscription:</Text>
            <Text style={benefitItem}>✓ 24/7 automated lead engagement</Text>
            <Text style={benefitItem}>✓ AI-powered conversations</Text>
            <Text style={benefitItem}>✓ Lead capture and qualification</Text>
            <Text style={benefitItem}>✓ Commission credits on your subscription</Text>
          </Section>

          <Button style={button} href={upgradeUrl}>
            Upgrade Now
          </Button>

          <Text style={smallText}>
            Plans start at just $29/month. Choose the plan that fits your needs.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Apex Affinity Group
            <br />
            Questions? Reply to this email or contact support@apexaffinity.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CopilotTrialEndingEmail;

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

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const warningSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px 24px',
  borderLeft: '4px solid #f59e0b',
};

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
};

const benefitsSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px 24px',
};

const benefitsTitle = {
  color: '#333',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const benefitItem = {
  color: '#0369a1',
  fontSize: '14px',
  margin: '4px 0',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '32px 40px',
};

const smallText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  padding: '0 40px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  textAlign: 'center' as const,
};
