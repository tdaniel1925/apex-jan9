/**
 * Founders Club Welcome Email Template
 * Sent when someone is added as a Founder Partner
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface FoundersWelcomeEmailProps {
  founderName: string;
  slotNumber: number;
  sharePercentage: number;
  dashboardUrl: string;
}

export function FoundersWelcomeEmail({
  founderName = 'Founder',
  slotNumber = 1,
  sharePercentage = 25,
  dashboardUrl = 'https://theapexway.net/dashboard',
}: FoundersWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Founders Club – You're Part of History</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={crownEmoji}>👑</Text>
            <Heading style={h1}>Welcome to the Founders Club</Heading>
            <Text style={headerSubtext}>You're Part of History</Text>
          </Section>

          <Text style={text}>Hi {founderName},</Text>

          <Text style={textBold}>This is a moment to remember.</Text>

          <Text style={text}>
            You have been selected as one of only <strong>four Founders</strong> of
            Apex Affinity Group. This isn't just a position — it's a partnership.
            You're now at the very foundation of what we're building together.
          </Text>

          <Hr style={hr} />

          {/* What Being a Founder Means */}
          <Section style={goldSection}>
            <Heading style={h2Gold}>🏆 What Being a Founder Means</Heading>
            <Text style={goldText}>
              As a Founding Partner, you share equally in <strong>25% of all override
              commissions</strong> generated across the entire Apex organization.
              Every agent who joins, every policy written, every life protected —
              you benefit from it all.
            </Text>
          </Section>

          {/* Benefits List */}
          <Section style={benefitsSection}>
            <Text style={benefitItem}>
              ✨ <strong>Equal partnership</strong> in all organizational override income
            </Text>
            <Text style={benefitItem}>
              🌳 <strong>Position at the root</strong> of the entire 5×7 matrix
            </Text>
            <Text style={benefitItem}>
              🚫 <strong>No qualification requirements</strong> — you're always earning
            </Text>
            <Text style={benefitItem}>
              📊 <strong>Full visibility</strong> into organizational performance
            </Text>
            <Text style={benefitItem}>
              🤝 <strong>Direct input</strong> in the direction of Apex Affinity Group
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Position Details */}
          <Heading style={h2}>📍 Your Founder Position</Heading>
          <Section style={positionCard}>
            <table style={positionTable}>
              <tbody>
                <tr>
                  <td style={positionLabel}>Partner Slot</td>
                  <td style={positionValue}>#{slotNumber} of 4</td>
                </tr>
                <tr>
                  <td style={positionLabel}>Share Percentage</td>
                  <td style={positionValue}>{sharePercentage}%</td>
                </tr>
                <tr>
                  <td style={positionLabel}>Matrix Position</td>
                  <td style={positionValue}>Level 0 (Root)</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          {/* What's Next */}
          <Heading style={h2}>🚀 What's Next</Heading>

          <Section style={stepSection}>
            <Text style={stepNumber}>1</Text>
            <div>
              <Text style={stepTitle}>Access your Founders Dashboard</Text>
              <Text style={stepText}>
                Monitor real-time organization growth and override earnings
              </Text>
            </div>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>2</Text>
            <div>
              <Text style={stepTitle}>Review partner agreements</Text>
              <Text style={stepText}>
                Legal documentation will be sent separately
              </Text>
            </div>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>3</Text>
            <div>
              <Text style={stepTitle}>Connect with fellow Founders</Text>
              <Text style={stepText}>
                You'll be introduced to the other three partners
              </Text>
            </div>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>4</Text>
            <div>
              <Text style={stepTitle}>Start building</Text>
              <Text style={stepText}>
                Your downline starts at Level 1 — recruit your first agents
              </Text>
            </div>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button style={primaryButton} href={dashboardUrl}>
              Access Founders Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Closing Message */}
          <Section style={closingSection}>
            <Text style={closingTitle}>This is just the beginning.</Text>
            <Text style={closingText}>
              What we're building at Apex Affinity Group has the potential to change
              thousands of lives — agents, families, and communities. And you're not
              just along for the ride. You're building it with us.
            </Text>
            <Text style={closingHighlight}>
              Welcome to the Founders Club. Let's make history.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            With partnership and purpose,
            <br />
            <strong>The Apex Affinity Group Leadership Team</strong>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Apex Affinity Group — Founders Club
            <br />
            Building Financial Freedom, One Family at a Time
            <br /><br />
            <Link href="https://theapexway.net" style={footerLink}>
              theapexway.net
            </Link>
            {' | '}
            <Link href="mailto:founders@theapexway.net" style={footerLink}>
              founders@theapexway.net
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default FoundersWelcomeEmail;

// Styles
const main = {
  backgroundColor: '#1a1a2e',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const headerSection = {
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  backgroundColor: '#1a1a2e',
  padding: '48px 40px',
  textAlign: 'center' as const,
};

const crownEmoji = {
  fontSize: '48px',
  margin: '0 0 16px',
};

const h1 = {
  color: '#ffd700',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
};

const headerSubtext = {
  color: '#e8e8e8',
  fontSize: '18px',
  margin: '0',
  fontStyle: 'italic' as const,
};

const h2 = {
  color: '#1a1a2e',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '32px 40px 16px',
};

const h2Gold = {
  color: '#b8860b',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const textBold = {
  color: '#1a1a2e',
  fontSize: '18px',
  fontWeight: 'bold',
  lineHeight: '26px',
  margin: '24px 0 16px',
  padding: '0 40px',
};

const goldSection = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #ffd700',
  margin: '24px 40px',
  padding: '24px',
};

const goldText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
};

const benefitsSection = {
  margin: '24px 40px',
  padding: '0',
};

const benefitItem = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '12px 0',
  padding: '8px 16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
};

const positionCard = {
  backgroundColor: '#1a1a2e',
  borderRadius: '12px',
  margin: '16px 40px',
  padding: '24px',
};

const positionTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const positionLabel = {
  color: '#a0a0a0',
  fontSize: '14px',
  padding: '8px 0',
  textAlign: 'left' as const,
};

const positionValue = {
  color: '#ffd700',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const stepSection = {
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
  margin: '16px 40px',
  padding: '0',
};

const stepNumber = {
  backgroundColor: '#ffd700',
  borderRadius: '50%',
  color: '#1a1a2e',
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
  color: '#1a1a2e',
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
  background: 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)',
  backgroundColor: '#ffd700',
  borderRadius: '8px',
  color: '#1a1a2e',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
};

const closingSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '0 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const closingTitle = {
  color: '#1a1a2e',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const closingText = {
  color: '#555',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const closingHighlight = {
  color: '#b8860b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  fontStyle: 'italic' as const,
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
  color: '#b8860b',
  textDecoration: 'underline',
};
