/**
 * Copilot Welcome Email Template
 * Sent when agent subscribes or starts a trial
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

interface CopilotWelcomeEmailProps {
  agentName: string;
  tier: string;
  isTrialing: boolean;
  trialDays?: number;
  dailyLimit: number | null;
  dashboardUrl: string;
  widgetUrl: string;
}

export function CopilotWelcomeEmail({
  agentName = 'Agent',
  tier = 'Basic',
  isTrialing = true,
  trialDays = 7,
  dailyLimit = 50,
  dashboardUrl = 'https://apexaffinity.com/copilot',
  widgetUrl = 'https://apexaffinity.com/copilot/widget',
}: CopilotWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {isTrialing
          ? `Your ${trialDays}-day AI Copilot trial has started!`
          : `Welcome to AI Copilot ${tier}!`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isTrialing ? 'Your Trial Has Started!' : 'Welcome to AI Copilot!'}
          </Heading>
          <Text style={text}>Hi {agentName},</Text>
          <Text style={text}>
            {isTrialing ? (
              <>
                Great news! Your <strong>{trialDays}-day free trial</strong> of AI Copilot has started.
                You have full access to try out the AI-powered chat widget on your website.
              </>
            ) : (
              <>
                Thank you for subscribing to AI Copilot <strong>{tier}</strong>! Your AI-powered
                assistant is now ready to engage leads on your website 24/7.
              </>
            )}
          </Text>

          <Section style={planSection}>
            <Text style={planLabel}>Your Plan</Text>
            <Text style={planValue}>{tier}</Text>
            <Text style={planDetail}>
              {dailyLimit ? `${dailyLimit} messages per day` : 'Unlimited messages'}
            </Text>
          </Section>

          <Section style={stepsSection}>
            <Text style={stepsTitle}>Get Started in 3 Easy Steps:</Text>
            <Text style={stepItem}>
              <strong>1.</strong> Go to your widget settings page
            </Text>
            <Text style={stepItem}>
              <strong>2.</strong> Customize your widget appearance and greeting
            </Text>
            <Text style={stepItem}>
              <strong>3.</strong> Copy the embed code and paste it on your website
            </Text>
          </Section>

          <Button style={button} href={widgetUrl}>
            Get Your Widget Code
          </Button>

          <Text style={text}>
            Once installed, your AI assistant will start engaging visitors immediately. You can
            track conversations and leads from your dashboard.
          </Text>

          <Button style={buttonSecondary} href={dashboardUrl}>
            View Dashboard
          </Button>

          {isTrialing && (
            <Section style={trialNote}>
              <Text style={trialNoteText}>
                <strong>Note:</strong> Your trial includes {dailyLimit || 20} messages per day.
                After {trialDays} days, you&apos;ll need to subscribe to continue using the copilot.
                We&apos;ll send you a reminder before your trial ends.
              </Text>
            </Section>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            Apex Affinity Group
            <br />
            Need help? Reply to this email or contact support@apexaffinity.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CopilotWelcomeEmail;

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

const planSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const planLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const planValue = {
  color: '#0ea5e9',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '8px 0',
};

const planDetail = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const stepsSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px 24px',
};

const stepsTitle = {
  color: '#333',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const stepItem = {
  color: '#333',
  fontSize: '14px',
  margin: '8px 0',
  paddingLeft: '8px',
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
  margin: '24px 40px',
};

const buttonSecondary = {
  backgroundColor: 'transparent',
  border: '2px solid #0ea5e9',
  borderRadius: '6px',
  color: '#0ea5e9',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '10px 20px',
  margin: '16px 40px',
};

const trialNote = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px 20px',
};

const trialNoteText = {
  color: '#92400e',
  fontSize: '13px',
  margin: '0',
  lineHeight: '20px',
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
