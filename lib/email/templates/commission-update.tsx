/**
 * Commission Update Email Template
 * Following CodeBakers patterns from 28-email-design.md
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

interface CommissionUpdateEmailProps {
  agentName: string;
  amount: number;
  period: string;
  viewUrl: string;
}

export function CommissionUpdateEmail({
  agentName = 'Agent',
  amount = 0,
  period = 'Current Period',
  viewUrl = 'https://theapexway.net/agent/wallet',
}: CommissionUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your commission of ${amount.toFixed(2)} has been calculated</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Commission Update</Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            Great news! Your commission for <strong>{period}</strong> has been calculated.
          </Text>
          <Section style={amountSection}>
            <Text style={amountLabel}>Commission Amount</Text>
            <Text style={amountValue}>${amount.toFixed(2)}</Text>
          </Section>
          <Text style={text}>
            This commission will be included in your next payout. View your full wallet details below.
          </Text>
          <Button style={button} href={viewUrl}>
            View Wallet
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            Apex Affinity Group
            <br />
            Questions? Reply to this email or contact support@theapexway.net
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CommissionUpdateEmail;

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

const amountSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '32px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const amountLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const amountValue = {
  color: '#0ea5e9',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '8px 0 0',
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
