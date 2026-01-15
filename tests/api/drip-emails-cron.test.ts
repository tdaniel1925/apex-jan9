/**
 * Drip Emails Cron Job API Tests
 * Tests for the background job that processes drip campaign emails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock environment
vi.stubEnv('CRON_SECRET', 'test-cron-secret');
vi.stubEnv('NODE_ENV', 'production');
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

// Mock dependencies
const mockGetPendingDripEmails = vi.fn();
const mockRecordDripEmailSent = vi.fn();
const mockResendSend = vi.fn();

vi.mock('@/lib/services/drip-campaign-service', () => ({
  getPendingDripEmails: () => mockGetPendingDripEmails(),
  recordDripEmailSent: (...args: unknown[]) => mockRecordDripEmailSent(...args),
}));

vi.mock('@/lib/email/resend-client', () => ({
  resend: {
    emails: {
      send: (opts: unknown) => mockResendSend(opts),
    },
  },
  EMAIL_CONFIG: {
    from: 'Apex <hello@theapexway.net>',
  },
}));

// Import after mocks
const { GET, POST } = await import('@/app/api/cron/drip-emails/route');

describe('Drip Emails Cron API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(method: string, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest('http://localhost:3000/api/cron/drip-emails', {
      method,
      headers: new Headers(headers),
    });
  }

  describe('Authorization', () => {
    it('should reject requests without authorization header', async () => {
      const request = createRequest('GET');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid authorization', async () => {
      const request = createRequest('GET', {
        authorization: 'Bearer wrong-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid authorization', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [],
        error: undefined,
      });

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('No Pending Emails', () => {
    it('should return success when no emails to send', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [],
        error: undefined,
      });

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('No pending emails to send');
      expect(data.sent).toBe(0);
    });
  });

  describe('Email Processing', () => {
    const mockEnrollment = {
      id: 'enrollment-1',
      campaign_id: 'campaign-1',
      agent_id: 'agent-1',
      current_email_index: 0,
    };

    const mockEmail = {
      id: 'email-1',
      subject: 'Welcome {{agentName}}!',
      html_content: '<p>Hello {{agentName}}, click here: {{unsubscribeUrl}}</p>',
    };

    it('should successfully send pending emails', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [
          {
            enrollment: mockEnrollment,
            email: mockEmail,
            agentEmail: 'agent@example.com',
            agentName: 'John Doe',
          },
        ],
      });

      mockResendSend.mockResolvedValueOnce({
        data: { id: 'resend-msg-123' },
        error: null,
      });

      mockRecordDripEmailSent.mockResolvedValueOnce({
        success: true,
        sendId: 'send-1',
      });

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sent).toBe(1);
      expect(data.failed).toBe(0);

      // Verify template variables were replaced
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'agent@example.com',
          subject: 'Welcome John Doe!',
        })
      );

      // Verify HTML content had variables replaced
      const callArgs = mockResendSend.mock.calls[0][0] as { html: string };
      expect(callArgs.html).toContain('Hello John Doe');
      expect(callArgs.html).toContain('/api/drip/unsubscribe/enrollment-1');
    });

    it('should handle multiple emails', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [
          {
            enrollment: { ...mockEnrollment, id: 'enrollment-1' },
            email: mockEmail,
            agentEmail: 'agent1@example.com',
            agentName: 'John Doe',
          },
          {
            enrollment: { ...mockEnrollment, id: 'enrollment-2' },
            email: mockEmail,
            agentEmail: 'agent2@example.com',
            agentName: 'Jane Smith',
          },
        ],
      });

      mockResendSend
        .mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'msg-2' }, error: null });

      mockRecordDripEmailSent
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.sent).toBe(2);
      expect(data.failed).toBe(0);
      expect(mockResendSend).toHaveBeenCalledTimes(2);
    });

    it('should handle email send failures gracefully', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [
          {
            enrollment: mockEnrollment,
            email: mockEmail,
            agentEmail: 'agent@example.com',
            agentName: 'John Doe',
          },
        ],
      });

      mockResendSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sent).toBe(0);
      expect(data.failed).toBe(1);
      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toBe('Rate limit exceeded');
    });

    it('should handle record send failures', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [
          {
            enrollment: mockEnrollment,
            email: mockEmail,
            agentEmail: 'agent@example.com',
            agentName: 'John Doe',
          },
        ],
      });

      mockResendSend.mockResolvedValueOnce({
        data: { id: 'msg-1' },
        error: null,
      });

      mockRecordDripEmailSent.mockResolvedValueOnce({
        success: false,
        error: 'Database error',
      });

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      // Email was sent but record failed - partial success
      expect(data.results[0].success).toBe(false);
    });

    it('should handle exceptions during processing', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [
          {
            enrollment: mockEnrollment,
            email: mockEmail,
            agentEmail: 'agent@example.com',
            agentName: 'John Doe',
          },
        ],
      });

      mockResendSend.mockRejectedValueOnce(new Error('Network error'));

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.sent).toBe(0);
      expect(data.failed).toBe(1);
      expect(data.results[0].error).toBe('Network error');
    });
  });

  describe('Error Handling', () => {
    it('should handle database fetch errors', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [],
        error: 'Connection failed',
      });

      const request = createRequest('GET', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch pending emails');
    });
  });

  describe('POST method', () => {
    it('should forward to GET handler for manual triggers', async () => {
      mockGetPendingDripEmails.mockResolvedValueOnce({
        enrollments: [],
        error: undefined,
      });

      const request = createRequest('POST', {
        authorization: 'Bearer test-cron-secret',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
