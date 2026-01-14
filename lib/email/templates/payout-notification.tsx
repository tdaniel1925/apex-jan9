/**
 * Payout Notification Email Template
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

interface PayoutNotificationEmailProps {
  agentName: string;
  amount: number;
  status: 'processing' | 'completed';
  paymentMethod: string;
  expectedDate?: string;
  viewUrl: string;
}

export function PayoutNotificationEmail({
  agentName = 'Agent',
  amount = 0,
  status = 'processing',
  paymentMethod = 'Bank Transfer',
  expectedDate,
  viewUrl = 'https://theapexway.net/agent/wallet',
}: PayoutNotificationEmailProps) {
  const isCompleted = status === 'completed';

  return (
    <Html>
      <Head />
      <Preview>
        {isCompleted
          ? `Your payout of $${amount.toFixed(2)} has been sent`
          : `Your payout of $${amount.toFixed(2)} is being processed`
        }
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isCompleted ? '✅ Payout Sent' : '⏳ Payout Processing'}
          </Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            {isCompleted
              ? 'Your payout has been successfully sent!'
              : 'Your payout is now being processed.'
            }
          </Text>
          <Section style={amountSection}>
            <Text style={amountLabel}>Payout Amount</Text>
            <Text style={amountValue}>${amount.toFixed(2)}</Text>
            <Text style={methodText}>via {paymentMethod}</Text>
          </Section>
          {!isCompleted && expectedDate && (
            <Text style={text}>
              <strong>Expected arrival:</strong> {expectedDate}
            </Text>
          )}
          {isCompleted && (
            <Text style={text}>
              The funds should appear in your account within 1-3 business days, depending on your bank.
            </Text>
          )}
          <Button style={button} href={viewUrl}>
            View Transaction Details
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

export default PayoutNotificationEmail;

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
  backgroundColor: '#fef3c7',
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
  color: '#f59e0b',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '8px 0 0',
};

const methodText = {
  color: '#666',
  fontSize: '14px',
  margin: '12px 0 0',
};

const button = {
  backgroundColor: '#f59e0b',
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
