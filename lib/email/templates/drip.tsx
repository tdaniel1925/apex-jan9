// Generic drip email template
// Renders content from drip-content.ts

import { EmailTemplate, Heading, Paragraph, Button, Divider, InfoBox } from './base';
import type { DripEmail } from '../drip-content';

interface DripEmailTemplateProps {
  firstName: string;
  email: DripEmail;
  unsubscribeUrl: string;
}

export function DripEmailTemplate({
  firstName,
  email,
  unsubscribeUrl,
}: DripEmailTemplateProps) {
  return (
    <EmailTemplate
      previewText={email.previewText}
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Personalized Greeting */}
      <Paragraph>Hi {firstName},</Paragraph>

      {/* Main Heading */}
      <Heading>{email.content.heading}</Heading>

      {/* Content Paragraphs */}
      {email.content.paragraphs.map((paragraph, index) => (
        <Paragraph key={index}>{paragraph}</Paragraph>
      ))}

      {/* Tips/Bullets (if provided) */}
      {email.content.tips && email.content.tips.length > 0 && (
        <>
          <Divider />
          <Paragraph>
            <strong style={{ fontSize: '18px', color: '#1a1a1a' }}>
              Key Takeaways:
            </strong>
          </Paragraph>
          <ul style={{
            margin: '0 0 24px',
            paddingLeft: '20px',
            listStyleType: 'disc',
          }}>
            {email.content.tips.map((tip, index) => (
              <li key={index} style={{
                marginBottom: '12px',
                color: '#333333',
                fontSize: '16px',
                lineHeight: '24px',
              }}>
                {tip}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Call to Action (if provided) */}
      {email.content.callToAction && (
        <>
          <Divider />
          <Button href={email.content.callToAction.url}>
            {email.content.callToAction.text}
          </Button>
        </>
      )}

      {/* Closing */}
      <Divider />
      <Paragraph>
        Talk soon,<br />
        <strong>The Apex Team</strong>
      </Paragraph>

      <Paragraph style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#666666',
      }}>
        <strong>📧 Next Email:</strong> Your next message in this series arrives in 3 days.
        You're on email {email.step} of 20 in your personalized training track.
      </Paragraph>
    </EmailTemplate>
  );
}
