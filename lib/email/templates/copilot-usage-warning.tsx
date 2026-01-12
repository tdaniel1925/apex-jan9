/**
 * Copilot Usage Warning Email Template
 * Notifies agent when they're approaching their daily message limit
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

interface CopilotUsageWarningEmailProps {
  agentName: string;
  usedMessages: number;
  limitMessages: number;
  percentUsed: number;
  currentTier: string;
  upgradeUrl: string;
}

export function CopilotUsageWarningEmail({
  agentName = 'Agent',
  usedMessages = 45,
  limitMessages = 50,
  percentUsed = 90,
  currentTier = 'Basic',
  upgradeUrl = 'https://apexaffinity.com/copilot/subscribe',
}: CopilotUsageWarningEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`You've used ${percentUsed}% of your daily AI Copilot messages`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Usage Alert</Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            You&apos;ve used <strong>{percentUsed}%</strong> of your daily AI Copilot messages on your {currentTier} plan.
          </Text>

          <Section style={usageSection}>
            <Text style={usageLabel}>Today&apos;s Usage</Text>
            <Text style={usageValue}>{usedMessages} / {limitMessages}</Text>
            <div style={progressBar}>
              <div style={{ ...progressFill, width: `${Math.min(100, percentUsed)}%` }} />
            </div>
            <Text style={usageSubtext}>
              {limitMessages - usedMessages} messages remaining today
            </Text>
          </Section>

          <Text style={text}>
            When you hit your limit, your widget will display a friendly message asking visitors to
            try again later. Upgrade your plan for more messages and never miss a lead.
          </Text>

          <Section style={upgradeSection}>
            <Text style={upgradeTitle}>Upgrade for more messages:</Text>
            <Text style={tierOption}>
              <strong>Pro Plan:</strong> 200 messages/day - $79/mo
            </Text>
            <Text style={tierOption}>
              <strong>Agency Plan:</strong> Unlimited messages - $199/mo
            </Text>
          </Section>

          <Button style={button} href={upgradeUrl}>
            Upgrade Now
          </Button>

          <Hr style={hr} />
          <Text style={footer}>
            Apex Affinity Group
            <br />
            Your usage resets at midnight UTC each day.
            <br />
            Questions? Reply to this email or contact support@apexaffinity.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CopilotUsageWarningEmail;

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

const usageSection = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const usageLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const usageValue = {
  color: '#dc2626',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '8px 0',
};

const progressBar = {
  backgroundColor: '#e5e7eb',
  borderRadius: '4px',
  height: '8px',
  margin: '16px 0',
  overflow: 'hidden' as const,
};

const progressFill = {
  backgroundColor: '#dc2626',
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
};

const usageSubtext = {
  color: '#666',
  fontSize: '12px',
  margin: '0',
};

const upgradeSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px 24px',
};

const upgradeTitle = {
  color: '#333',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const tierOption = {
  color: '#0369a1',
  fontSize: '14px',
  margin: '8px 0',
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
