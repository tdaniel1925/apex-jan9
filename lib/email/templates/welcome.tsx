// Welcome email sent immediately after signup

import { EmailTemplate, Heading, Paragraph, Button, Divider, InfoBox } from './base';

interface WelcomeEmailProps {
  firstName: string;
  lastName: string;
  username: string;
  sponsorName?: string;
  unsubscribeUrl: string;
}

export function WelcomeEmail({
  firstName,
  lastName,
  username,
  sponsorName,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  return (
    <EmailTemplate
      previewText={`Welcome to Apex Affinity Group, ${firstName}! Your journey begins here.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading>Welcome to Apex Affinity Group, {firstName}!</Heading>

      <Paragraph>
        Congratulations on taking the first step toward building a thriving insurance business!
        We're excited to have you join our community of ambitious professionals who are redefining
        success in the insurance industry.
      </Paragraph>

      {sponsorName && (
        <>
          <Paragraph>
            You've been enrolled by <strong>{sponsorName}</strong>, who will be your sponsor
            and guide as you begin your journey with Apex.
          </Paragraph>
        </>
      )}

      <Divider />

      <InfoBox>
        <Paragraph>
          <strong style={{ fontSize: '18px', color: '#0066cc' }}>Your Account Details</strong>
        </Paragraph>
        <Paragraph>
          <strong>Username:</strong> {username}<br />
          <strong>Password:</strong> The password you created during registration
        </Paragraph>
        <Paragraph style={{ margin: '16px 0 0', fontSize: '14px', color: '#666' }}>
          Keep these credentials secure. You'll use them to access your dashboard and manage your business.
        </Paragraph>
      </InfoBox>

      <Divider />

      <Heading style={{ fontSize: '22px', margin: '0 0 16px' }}>
        Getting Started
      </Heading>

      <Paragraph>
        <strong>1. Log in to your dashboard:</strong> Access your personalized back office
        to view your team, track your progress, and manage your account.
      </Paragraph>

      <Button href="https://theapexway.net/login">
        Access Your Dashboard
      </Button>

      <Paragraph>
        <strong>2. Share your replicated site:</strong> Your unique website is:
      </Paragraph>

      <InfoBox>
        <Paragraph style={{ margin: 0, textAlign: 'center', fontSize: '18px' }}>
          <a href={`https://theapexway.net/${username}`} style={{
            color: '#0066cc',
            textDecoration: 'none',
            fontWeight: '600',
          }}>
            theapexway.net/{username}
          </a>
        </Paragraph>
      </InfoBox>

      <Paragraph>
        Share this link with prospects to invite them to join your team. They'll see
        your information and can sign up directly under you.
      </Paragraph>

      <Paragraph>
        <strong>3. Check your email:</strong> Over the next few weeks, you'll receive
        valuable insights, training materials, and strategies to help you succeed with Apex.
      </Paragraph>

      <Divider />

      <Heading style={{ fontSize: '22px', margin: '0 0 16px' }}>
        What Makes Apex Different?
      </Heading>

      <Paragraph>
        At Apex Affinity Group, we're not just another MLM opportunity. We're building
        a community of insurance professionals who:
      </Paragraph>

      <ul style={{ margin: '0 0 16px', paddingLeft: '20px' }}>
        <li style={{ marginBottom: '8px', color: '#333' }}>
          <Paragraph style={{ margin: 0 }}>
            <strong>Own their business</strong> with unlimited earning potential
          </Paragraph>
        </li>
        <li style={{ marginBottom: '8px', color: '#333' }}>
          <Paragraph style={{ margin: 0 }}>
            <strong>Build generational wealth</strong> through our proven 5×7 matrix system
          </Paragraph>
        </li>
        <li style={{ marginBottom: '8px', color: '#333' }}>
          <Paragraph style={{ margin: 0 }}>
            <strong>Help others succeed</strong> while growing their own success
          </Paragraph>
        </li>
        <li style={{ marginBottom: '8px', color: '#333' }}>
          <Paragraph style={{ margin: 0 }}>
            <strong>Access world-class training</strong> and ongoing support
          </Paragraph>
        </li>
      </ul>

      <Divider />

      <Paragraph>
        Your journey starts now. Log in to your dashboard, explore your replicated site,
        and get ready to build something extraordinary.
      </Paragraph>

      <Paragraph style={{ marginTop: '32px' }}>
        <strong>Welcome to the Apex family!</strong>
      </Paragraph>

      <Paragraph>
        The Apex Team
      </Paragraph>
    </EmailTemplate>
  );
}
