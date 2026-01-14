/**
 * New Lead Notification Email Template
 * Sent to agents when someone submits their info on the replicated site
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

interface NewLeadNotificationEmailProps {
  agentName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  leadMessage?: string;
  source: string;
  viewUrl: string;
}

export function NewLeadNotificationEmail({
  agentName = 'Agent',
  leadName = 'New Lead',
  leadEmail = 'lead@example.com',
  leadPhone,
  leadMessage,
  source = 'Your replicated site',
  viewUrl = 'https://theapexway.net/dashboard/contacts',
}: NewLeadNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New lead: {leadName} just submitted their info!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={h1}>🎉 New Lead Alert!</Heading>
          </Section>

          <Text style={text}>Hey {agentName},</Text>

          <Text style={text}>
            Great news! Someone just expressed interest through {source}. Here are their details:
          </Text>

          {/* Lead Details */}
          <Section style={leadSection}>
            <Text style={leadLabel}>Name</Text>
            <Text style={leadValue}>{leadName}</Text>

            <Text style={leadLabel}>Email</Text>
            <Text style={leadValue}>{leadEmail}</Text>

            {leadPhone && (
              <>
                <Text style={leadLabel}>Phone</Text>
                <Text style={leadValue}>{leadPhone}</Text>
              </>
            )}

            {leadMessage && (
              <>
                <Text style={leadLabel}>Message</Text>
                <Text style={leadMessageStyle}>&quot;{leadMessage}&quot;</Text>
              </>
            )}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={text}>
              <strong>Act fast!</strong> The sooner you reach out, the better your chances
              of converting this lead. We recommend contacting them within 5 minutes.
            </Text>
            <Button style={button} href={viewUrl}>
              View Lead in CRM
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Quick Response Tips */}
          <Text style={tipsTitle}>Quick Response Tips:</Text>
          <Text style={text}>
            • <strong>Call first</strong> - A phone call is 10x more effective than email
            <br />
            • <strong>Be warm and friendly</strong> - They&apos;re interested, not committed
            <br />
            • <strong>Ask questions</strong> - Learn about their situation before pitching
            <br />
            • <strong>Follow up</strong> - If they don&apos;t answer, try again tomorrow
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Apex Affinity Group
            <br />
            You&apos;re receiving this because you have a lead capture form on your replicated site.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default NewLeadNotificationEmail;

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
  backgroundColor: '#10b981',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const leadSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  margin: '24px 40px',
  padding: '20px 24px',
};

const leadLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const leadValue = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px',
};

const leadMessageStyle = {
  color: '#475569',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  margin: '0',
  lineHeight: '22px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const tipsTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
  padding: '0 40px',
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
