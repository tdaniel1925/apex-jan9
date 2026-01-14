/**
 * Lead Nurturing Email Template
 * Following CodeBakers patterns from 28-email-design.md
 * Sent on behalf of the recruiting agent to prospects
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

export interface LeadNurturingEmailProps {
  // Lead info
  leadFirstName: string;
  leadEmail: string;
  // Agent info (sender on behalf)
  agentFirstName: string;
  agentLastName: string;
  agentEmail: string;
  agentPhone?: string;
  agentCalendarLink?: string;
  // Email content
  subject: string;
  previewText: string;
  bodyHtml: string;
  // Tracking
  trackingPixelUrl?: string;
  unsubscribeUrl: string;
  // Optional CTA
  ctaText?: string;
  ctaUrl?: string;
}

export function LeadNurturingEmail({
  leadFirstName = 'Friend',
  agentFirstName = 'Your Agent',
  agentLastName = '',
  agentEmail = 'agent@theapexway.net',
  agentPhone,
  agentCalendarLink,
  previewText = 'A message from Apex Affinity Group',
  bodyHtml = '',
  trackingPixelUrl,
  unsubscribeUrl = '#',
  ctaText,
  ctaUrl,
}: LeadNurturingEmailProps) {
  // Replace template variables in body
  const processedBody = bodyHtml
    .replace(/\{\{lead\.first_name\}\}/g, leadFirstName)
    .replace(/\{\{agent\.first_name\}\}/g, agentFirstName)
    .replace(/\{\{agent\.last_name\}\}/g, agentLastName)
    .replace(/\{\{agent\.email\}\}/g, agentEmail)
    .replace(/\{\{agent\.phone\}\}/g, agentPhone || '')
    .replace(/\{\{agent\.calendar_link\}\}/g, agentCalendarLink || '#');

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Email body content */}
          <Section style={content}>
            <div dangerouslySetInnerHTML={{ __html: processedBody }} />
          </Section>

          {/* Optional CTA Button */}
          {ctaText && ctaUrl && (
            <Button style={button} href={ctaUrl}>
              {ctaText}
            </Button>
          )}

          <Hr style={hr} />

          {/* Agent signature */}
          <Section style={signature}>
            <Text style={signatureText}>
              {agentFirstName} {agentLastName}
              <br />
              <span style={signatureRole}>Apex Affinity Group Agent</span>
            </Text>
            {agentPhone && (
              <Text style={contactInfo}>
                Phone: <Link href={`tel:${agentPhone}`}>{agentPhone}</Link>
              </Text>
            )}
            <Text style={contactInfo}>
              Email: <Link href={`mailto:${agentEmail}`}>{agentEmail}</Link>
            </Text>
            {agentCalendarLink && (
              <Text style={contactInfo}>
                <Link href={agentCalendarLink}>Schedule a Call</Link>
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you expressed interest in learning more about Apex Affinity Group.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe from these emails
              </Link>
            </Text>
            <Text style={footerText}>
              Apex Affinity Group | Building Financial Futures
            </Text>
          </Section>

          {/* Tracking pixel */}
          {trackingPixelUrl && (
            <Img
              src={trackingPixelUrl}
              width="1"
              height="1"
              alt=""
              style={{ display: 'none' }}
            />
          )}
        </Container>
      </Body>
    </Html>
  );
}

export default LeadNurturingEmail;

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

const content = {
  padding: '0 40px',
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

const signature = {
  padding: '0 40px',
};

const signatureText = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const signatureRole = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'normal',
};

const contactInfo = {
  color: '#666',
  fontSize: '14px',
  margin: '4px 0',
};

const footer = {
  padding: '0 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};
