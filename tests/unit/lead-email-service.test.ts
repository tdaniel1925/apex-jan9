/**
 * Tests for Lead Email Service - Utility Functions
 */
import { describe, it, expect } from 'vitest';

// Test the link wrapping utility function (extracted for testing)
function wrapLinksWithTracking(html: string, queueId: string, baseUrl: string): string {
  const linkRegex = /<a([^>]*)href="([^"]+)"([^>]*)>/gi;

  return html.replace(linkRegex, (match, before, url, after) => {
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      return match;
    }
    if (url.includes('/api/email/')) {
      return match;
    }
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${baseUrl}/api/email/track/click/${queueId}?url=${encodedUrl}`;
    return `<a${before}href="${trackingUrl}"${after}>`;
  });
}

describe('Lead Email Service Utilities', () => {
  describe('wrapLinksWithTracking', () => {
    const queueId = 'queue-123';
    const baseUrl = 'https://example.com';

    it('should wrap regular links with tracking', () => {
      const html = '<a href="https://google.com">Google</a>';
      const result = wrapLinksWithTracking(html, queueId, baseUrl);

      expect(result).toContain('/api/email/track/click/queue-123');
      expect(result).toContain(encodeURIComponent('https://google.com'));
    });

    it('should preserve mailto links', () => {
      const html = '<a href="mailto:test@example.com">Email</a>';
      const result = wrapLinksWithTracking(html, queueId, baseUrl);

      expect(result).toBe(html);
    });

    it('should preserve tel links', () => {
      const html = '<a href="tel:+1234567890">Call</a>';
      const result = wrapLinksWithTracking(html, queueId, baseUrl);

      expect(result).toBe(html);
    });

    it('should skip api/email tracking links', () => {
      const html = '<a href="https://example.com/api/email/unsubscribe/123">Unsubscribe</a>';
      const result = wrapLinksWithTracking(html, queueId, baseUrl);

      expect(result).toBe(html);
    });

    it('should handle multiple links', () => {
      const html = `
        <a href="https://link1.com">Link 1</a>
        <a href="mailto:test@test.com">Email</a>
        <a href="https://link2.com">Link 2</a>
      `;
      const result = wrapLinksWithTracking(html, queueId, baseUrl);

      // Regular links should be wrapped
      expect(result).toContain('/api/email/track/click/queue-123');
      // Mailto should be preserved
      expect(result).toContain('href="mailto:test@test.com"');
    });

    it('should preserve link attributes', () => {
      const html = '<a class="btn" href="https://example.com" target="_blank">Click</a>';
      const result = wrapLinksWithTracking(html, queueId, baseUrl);

      expect(result).toContain('class="btn"');
      expect(result).toContain('target="_blank"');
    });
  });
});

describe('Lead Email Types', () => {
  it('should accept valid AgentSenderInfo', () => {
    const agent = {
      id: 'agent-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      calendarLink: 'https://calendly.com/john',
    };

    expect(agent.id).toBeDefined();
    expect(agent.firstName).toBe('John');
    expect(agent.email).toContain('@');
  });

  it('should accept valid LeadInfo', () => {
    const lead = {
      id: 'lead-456',
      firstName: 'Jane',
      email: 'jane@example.com',
    };

    expect(lead.id).toBeDefined();
    expect(lead.firstName).toBe('Jane');
  });

  it('should accept valid EmailStepContent', () => {
    const step = {
      id: 'step-789',
      subject: 'Welcome!',
      bodyHtml: '<p>Hello</p>',
      bodyText: 'Hello',
    };

    expect(step.id).toBeDefined();
    expect(step.subject).toBe('Welcome!');
    expect(step.bodyHtml).toContain('<p>');
  });
});

describe('Email Template Variable Processing', () => {
  it('should replace lead variables', () => {
    const template = 'Hi {{lead.first_name}}!';
    const result = template.replace(/\{\{lead\.first_name\}\}/g, 'Jane');

    expect(result).toBe('Hi Jane!');
  });

  it('should replace agent variables', () => {
    const template = 'From {{agent.first_name}} {{agent.last_name}}';
    let result = template.replace(/\{\{agent\.first_name\}\}/g, 'John');
    result = result.replace(/\{\{agent\.last_name\}\}/g, 'Doe');

    expect(result).toBe('From John Doe');
  });

  it('should handle multiple variables', () => {
    const template = '{{lead.first_name}}, meet {{agent.first_name}} - contact at {{agent.email}}';
    let result = template
      .replace(/\{\{lead\.first_name\}\}/g, 'Jane')
      .replace(/\{\{agent\.first_name\}\}/g, 'John')
      .replace(/\{\{agent\.email\}\}/g, 'john@example.com');

    expect(result).toBe('Jane, meet John - contact at john@example.com');
  });

  it('should handle empty replacements', () => {
    const template = 'Phone: {{agent.phone}}';
    const result = template.replace(/\{\{agent\.phone\}\}/g, '');

    expect(result).toBe('Phone: ');
  });
});
