/**
 * Withdrawal Rejected Email Template
 * Sent when a withdrawal request is rejected by admin
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

interface WithdrawalRejectedEmailProps {
  agentName: string;
  amount: number;
  paymentMethod: string;
  reason?: string;
  viewUrl: string;
  supportEmail: string;
}

export function WithdrawalRejectedEmail({
  agentName = 'Agent',
  amount = 0,
  paymentMethod = 'ACH',
  reason,
  viewUrl = 'https://theapexway.net/dashboard/wallet',
  supportEmail = 'support@theapexway.net',
}: WithdrawalRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your withdrawal request for ${amount.toFixed(2)} was not approved
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Withdrawal Request Update</Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            Unfortunately, your withdrawal request could not be processed at this time.
          </Text>
          <Section style={detailsSection}>
            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={labelCell}>Amount Requested</td>
                  <td style={valueCell}>${amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Payment Method</td>
                  <td style={valueCell}>{paymentMethod}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Status</td>
                  <td style={statusCell}>Not Approved</td>
                </tr>
              </tbody>
            </table>
          </Section>
          {reason && (
            <Section style={reasonBox}>
              <Text style={reasonLabel}>Reason:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}
          <Text style={text}>
            The funds have been returned to your available balance. If you believe this was a mistake or have questions, please contact our support team.
          </Text>
          <Button style={button} href={viewUrl}>
            View Your Wallet
          </Button>
          <Section style={helpBox}>
            <Text style={helpTitle}>Need Help?</Text>
            <Text style={helpText}>
              Contact our support team at{' '}
              <a href={`mailto:${supportEmail}`} style={link}>
                {supportEmail}
              </a>
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Apex Affinity Group
            <br />
            This is an automated message regarding your account.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WithdrawalRejectedEmail;

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

const statusCell = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const reasonBox = {
  margin: '24px 40px',
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px 20px',
  borderLeft: '4px solid #dc2626',
};

const reasonLabel = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const reasonText = {
  color: '#7f1d1d',
  fontSize: '14px',
  margin: '0',
  lineHeight: '22px',
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

const helpBox = {
  margin: '24px 40px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px 20px',
  textAlign: 'center' as const,
};

const helpTitle = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const helpText = {
  color: '#15803d',
  fontSize: '14px',
  margin: '0',
};

const link = {
  color: '#0ea5e9',
  textDecoration: 'underline',
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
