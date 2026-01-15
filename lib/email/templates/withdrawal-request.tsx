/**
 * Withdrawal Request Email Template
 * Sent when an agent submits a new withdrawal request
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

interface WithdrawalRequestEmailProps {
  agentName: string;
  amount: number;
  netAmount: number;
  fee: number;
  paymentMethod: string;
  estimatedDays: string;
  viewUrl: string;
}

export function WithdrawalRequestEmail({
  agentName = 'Agent',
  amount = 0,
  netAmount = 0,
  fee = 0,
  paymentMethod = 'ACH',
  estimatedDays = '3-5 business days',
  viewUrl = 'https://theapexway.net/dashboard/wallet',
}: WithdrawalRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your withdrawal request for ${amount.toFixed(2)} has been submitted
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Withdrawal Request Received</Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            We&apos;ve received your withdrawal request. Here are the details:
          </Text>
          <Section style={detailsSection}>
            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={labelCell}>Withdrawal Amount</td>
                  <td style={valueCell}>${amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Fee</td>
                  <td style={valueCell}>-${fee.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={labelCellTotal}>You&apos;ll Receive</td>
                  <td style={valueCellTotal}>${netAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </Section>
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Payment Method:</strong> {paymentMethod}
            </Text>
            <Text style={infoText}>
              <strong>Estimated Arrival:</strong> {estimatedDays}
            </Text>
            <Text style={infoText}>
              <strong>Status:</strong> Pending Review
            </Text>
          </Section>
          <Text style={text}>
            Your request is being reviewed and will be processed shortly. You&apos;ll receive another email when the funds are on their way.
          </Text>
          <Button style={button} href={viewUrl}>
            View Withdrawal Status
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            Apex Affinity Group
            <br />
            If you didn&apos;t request this withdrawal, please contact us immediately at support@theapexway.net
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WithdrawalRequestEmail;

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
  margin: '40px 0 20px',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const detailsSection = {
  margin: '24px 40px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
};

const detailsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const labelCell = {
  color: '#666',
  fontSize: '14px',
  padding: '8px 0',
  textAlign: 'left' as const,
};

const valueCell = {
  color: '#333',
  fontSize: '14px',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const labelCellTotal = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 0 8px',
  borderTop: '1px solid #e2e8f0',
  textAlign: 'left' as const,
};

const valueCellTotal = {
  color: '#059669',
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '12px 0 8px',
  borderTop: '1px solid #e2e8f0',
  textAlign: 'right' as const,
};

const infoBox = {
  margin: '24px 40px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '16px 20px',
  borderLeft: '4px solid #3b82f6',
};

const infoText = {
  color: '#1e40af',
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
