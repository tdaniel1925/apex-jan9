/**
 * Bonus Approval Email Template
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

interface BonusApprovalEmailProps {
  agentName: string;
  bonusType: string;
  amount: number;
  reason?: string;
  viewUrl: string;
}

export function BonusApprovalEmail({
  agentName = 'Agent',
  bonusType = 'Performance Bonus',
  amount = 0,
  reason = '',
  viewUrl = 'https://theapexway.net/agent/wallet',
}: BonusApprovalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {bonusType} of ${amount.toFixed(2)} has been approved!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Bonus Approved!</Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            Congratulations! Your <strong>{bonusType}</strong> has been approved.
          </Text>
          <Section style={amountSection}>
            <Text style={amountLabel}>Bonus Amount</Text>
            <Text style={amountValue}>${amount.toFixed(2)}</Text>
            {reason && <Text style={reasonText}>{reason}</Text>}
          </Section>
          <Text style={text}>
            This bonus will be included in your next payout. Keep up the great work!
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

export default BonusApprovalEmail;

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
  backgroundColor: '#ecfdf5',
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
  color: '#10b981',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '8px 0 0',
};

const reasonText = {
  color: '#666',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  margin: '12px 0 0',
};

const button = {
  backgroundColor: '#10b981',
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
