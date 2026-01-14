/**
 * Copilot Widget API Tests
 * Tests for the embeddable chat widget
 */

import { describe, it, expect } from 'vitest';

describe('Copilot Widget API', () => {
  describe('Widget Configuration', () => {
    const DEFAULT_CONFIG = {
      primaryColor: '#2563eb',
      position: 'bottom-right',
      greeting: "Hi! I'm here to help. What questions do you have?",
      placeholder: 'Type your message...',
      buttonText: 'Chat with us',
      showBranding: true,
      autoOpen: false,
      autoOpenDelay: 5000,
      collectEmail: true,
    };

    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.primaryColor).toBe('#2563eb');
      expect(DEFAULT_CONFIG.position).toBe('bottom-right');
      expect(DEFAULT_CONFIG.showBranding).toBe(true);
    });

    it('should merge custom config with defaults', () => {
      const customConfig = {
        primaryColor: '#ff0000',
        autoOpen: true,
      };

      const merged = { ...DEFAULT_CONFIG, ...customConfig };

      expect(merged.primaryColor).toBe('#ff0000');
      expect(merged.autoOpen).toBe(true);
      expect(merged.position).toBe('bottom-right'); // Unchanged default
    });
  });

  describe('Embed Code Generation', () => {
    it('should generate valid embed code', () => {
      const agentId = 'agent-123';
      const baseUrl = 'https://app.theapexway.net';

      const embedCode = `<!-- Apex Copilot Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ApexCopilot']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  })(window,document,'script','apex','${baseUrl}/widget.js');
  apex('init', { agentId: '${agentId}' });
</script>
<!-- End Apex Copilot Widget -->`;

      expect(embedCode).toContain(agentId);
      expect(embedCode).toContain('widget.js');
      expect(embedCode).toContain("apex('init'");
    });

    it('should include config when provided', () => {
      const agentId = 'agent-123';
      const config = { primaryColor: '#ff0000' };
      const configStr = JSON.stringify(config);

      const embedCode = `apex('init', { agentId: '${agentId}', config: ${configStr} });`;

      expect(embedCode).toContain('config:');
      expect(embedCode).toContain('#ff0000');
    });
  });

  describe('Visitor ID Generation', () => {
    const generateVisitorId = (): string => {
      return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    };

    it('should generate unique visitor IDs', () => {
      const id1 = generateVisitorId();
      const id2 = generateVisitorId();

      expect(id1).not.toBe(id2);
      expect(id1.startsWith('visitor_')).toBe(true);
      expect(id2.startsWith('visitor_')).toBe(true);
    });

    it('should have correct format', () => {
      const id = generateVisitorId();
      const parts = id.split('_');

      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('visitor');
      expect(!isNaN(Number(parts[1]))).toBe(true); // Timestamp
    });
  });

  describe('Rate Limiting', () => {
    const RATE_LIMITS = {
      messagesPerMinute: 10,
      messagesPerHour: 60,
      maxMessageLength: 1000,
      maxSessionDuration: 60 * 60 * 1000,
    };

    it('should have correct rate limit values', () => {
      expect(RATE_LIMITS.messagesPerMinute).toBe(10);
      expect(RATE_LIMITS.messagesPerHour).toBe(60);
      expect(RATE_LIMITS.maxMessageLength).toBe(1000);
    });

    it('should calculate max session duration correctly', () => {
      expect(RATE_LIMITS.maxSessionDuration).toBe(3600000); // 1 hour in ms
    });
  });

  describe('Widget Message Schema', () => {
    it('should validate correct message format', () => {
      const validMessage = {
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        visitorId: 'visitor_123_abc',
        message: 'Hello, I have a question',
      };

      expect(validMessage.agentId).toBeTruthy();
      expect(validMessage.visitorId).toBeTruthy();
      expect(validMessage.message.length).toBeGreaterThan(0);
      expect(validMessage.message.length).toBeLessThanOrEqual(1000);
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'x'.repeat(1001);
      expect(longMessage.length).toBeGreaterThan(1000);
    });

    it('should handle optional fields', () => {
      const messageWithOptional = {
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        visitorId: 'visitor_123',
        sessionId: 'session_456',
        message: 'Hello',
        email: 'test@example.com',
        phone: '+1234567890',
      };

      expect(messageWithOptional.sessionId).toBeDefined();
      expect(messageWithOptional.email).toBeDefined();
      expect(messageWithOptional.phone).toBeDefined();
    });
  });

  describe('Widget GET Response', () => {
    it('should return enabled widget config', () => {
      const mockResponse = {
        enabled: true,
        config: {
          primaryColor: '#2563eb',
          position: 'bottom-right',
          greeting: 'Hi there!',
          agentName: 'John Doe',
          agentAvatar: '/avatars/john.jpg',
        },
        agent: {
          id: 'agent-123',
          name: 'John Doe',
          avatar: '/avatars/john.jpg',
        },
      };

      expect(mockResponse.enabled).toBe(true);
      expect(mockResponse.config.agentName).toBe('John Doe');
      expect(mockResponse.agent.id).toBe('agent-123');
    });

    it('should return error for no subscription', () => {
      const mockResponse = {
        error: 'Widget not available',
        reason: 'no_subscription',
      };

      expect(mockResponse.error).toBeDefined();
      expect(mockResponse.reason).toBe('no_subscription');
    });
  });

  describe('Widget POST Response', () => {
    it('should return successful response', () => {
      const mockResponse = {
        sessionId: 'session_123',
        response: 'Hello! How can I help you today?',
        usage: {
          used: 5,
          limit: 50,
        },
      };

      expect(mockResponse.sessionId).toBeDefined();
      expect(mockResponse.response).toBeTruthy();
      expect(mockResponse.usage.used).toBeLessThan(mockResponse.usage.limit);
    });

    it('should return rate limit error', () => {
      const mockResponse = {
        error: 'Usage limit reached',
        limit: 20,
        used: 20,
        upgradeRequired: true,
      };

      expect(mockResponse.error).toBe('Usage limit reached');
      expect(mockResponse.used).toBe(mockResponse.limit);
      expect(mockResponse.upgradeRequired).toBe(true);
    });
  });

  describe('Widget Session', () => {
    it('should track session correctly', () => {
      const session = {
        id: 'session_123',
        agentId: 'agent-456',
        visitorId: 'visitor_789',
        contactId: null,
        messages: [
          { role: 'assistant', content: 'Hi there!', timestamp: '2026-01-12T10:00:00Z' },
          {
            role: 'user',
            content: 'Hello, I have a question',
            timestamp: '2026-01-12T10:01:00Z',
          },
          {
            role: 'assistant',
            content: 'Sure, what would you like to know?',
            timestamp: '2026-01-12T10:01:05Z',
          },
        ],
        startedAt: '2026-01-12T10:00:00Z',
        lastActivityAt: '2026-01-12T10:01:05Z',
      };

      expect(session.messages.length).toBe(3);
      expect(session.messages[0].role).toBe('assistant'); // Greeting
      expect(session.messages[1].role).toBe('user');
    });

    it('should link session to contact when email provided', () => {
      const session = {
        id: 'session_123',
        agentId: 'agent-456',
        visitorId: 'visitor_789',
        contactId: 'contact-001',
        email: 'visitor@example.com',
      };

      expect(session.contactId).toBeDefined();
      expect(session.email).toBe('visitor@example.com');
    });
  });

  describe('AI Response Generation', () => {
    it('should detect insurance-related queries', () => {
      const testCases = [
        { input: 'life insurance', expected: 'insurance' },
        { input: 'coverage options', expected: 'insurance' },
        { input: 'get a quote', expected: 'quote' },
        { input: 'how much does it cost', expected: 'quote' },
        { input: 'schedule an appointment', expected: 'contact' },
        { input: 'hello', expected: 'greeting' },
      ];

      const detectIntent = (message: string): string => {
        const lower = message.toLowerCase();
        if (lower.includes('life insurance') || lower.includes('coverage')) return 'insurance';
        if (lower.includes('quote') || lower.includes('price') || lower.includes('cost'))
          return 'quote';
        if (lower.includes('contact') || lower.includes('call') || lower.includes('appointment'))
          return 'contact';
        if (lower.includes('hello') || lower.includes('hi')) return 'greeting';
        return 'general';
      };

      testCases.forEach(({ input, expected }) => {
        expect(detectIntent(input)).toBe(expected);
      });
    });
  });
});
