/**
 * Unit tests for Admin Training Certificates API
 * Tests GET /api/admin/training/certificates
 * Tests GET /api/admin/training/certificates/[certificateId]
 * Tests DELETE /api/admin/training/certificates/[certificateId]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/training/certificates/route';
import { GET as GET_SINGLE, DELETE } from '@/app/api/admin/training/certificates/[certificateId]/route';

// Mock the admin auth module
vi.mock('@/lib/auth/admin-auth', () => ({
  verifyAdmin: vi.fn(),
  forbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })),
  notFoundResponse: vi.fn((msg: string) => new Response(JSON.stringify({ error: msg }), { status: 404 })),
  badRequestResponse: vi.fn((msg: string, details?: unknown) =>
    new Response(JSON.stringify({ error: msg, details }), { status: 400 })
  ),
  serverErrorResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 })),
}));

// Mock Supabase
const mockSupabaseSelect = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({
  select: mockSupabaseSelect,
}));
const mockSupabaseClient = {
  from: mockSupabaseFrom,
};

vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

import { verifyAdmin } from '@/lib/auth/admin-auth';

describe('Admin Training Certificates API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/training/certificates', () => {
    it('should return 403 when not authenticated as admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return certificates list when authenticated', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      const mockCertificates = [
        {
          id: 'cert-1',
          agent_id: 'agent-1',
          certificate_number: 'CERT-001',
          title: 'Test Certificate',
          recipient_name: 'John Doe',
          issued_at: '2024-01-01T00:00:00Z',
          agent: { id: 'agent-1', first_name: 'John', last_name: 'Doe', email: 'john@test.com', agent_code: 'A001' },
          course: { id: 'course-1', title: 'Test Course' },
          track: null,
        },
      ];

      mockSupabaseSelect.mockReturnValueOnce({
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({
          data: mockCertificates,
          error: null,
          count: 1,
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.certificates).toHaveLength(1);
      expect(data.certificates[0].title).toBe('Test Certificate');
      expect(data.total).toBe(1);
    });

    it('should filter certificates by agent_id', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseSelect.mockReturnValueOnce(mockQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/training/certificates?agent_id=123e4567-e89b-12d3-a456-426614174000'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle invalid query parameters', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/training/certificates?limit=invalid'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/training/certificates/[certificateId]', () => {
    it('should return 403 when not authenticated as admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates/cert-1');
      const response = await GET_SINGLE(request, { params: Promise.resolve({ certificateId: 'cert-1' }) });

      expect(response.status).toBe(403);
    });

    it('should return certificate when found', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      const mockCertificate = {
        id: 'cert-1',
        agent_id: 'agent-1',
        certificate_number: 'CERT-001',
        title: 'Test Certificate',
        recipient_name: 'John Doe',
        issued_at: '2024-01-01T00:00:00Z',
        agent: { id: 'agent-1', first_name: 'John', last_name: 'Doe', email: 'john@test.com', agent_code: 'A001' },
        course: { id: 'course-1', title: 'Test Course' },
        track: null,
      };

      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockCertificate,
          error: null,
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates/cert-1');
      const response = await GET_SINGLE(request, { params: Promise.resolve({ certificateId: 'cert-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.certificate.id).toBe('cert-1');
      expect(data.certificate.title).toBe('Test Certificate');
    });

    it('should return 404 when certificate not found', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates/nonexistent');
      const response = await GET_SINGLE(request, { params: Promise.resolve({ certificateId: 'nonexistent' }) });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/training/certificates/[certificateId]', () => {
    it('should return 403 when not authenticated as admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates/cert-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ certificateId: 'cert-1' }) });

      expect(response.status).toBe(403);
    });

    it('should delete certificate when found', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      let callCount = 0;
      // Reset the from mock to handle both the check and delete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseFrom.mockImplementation((): any => {
        callCount++;
        if (callCount === 1) {
          // First call: existence check via select
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'cert-1' },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Second call: delete
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates/cert-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ certificateId: 'cert-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Certificate revoked');
    });

    it('should return 404 when certificate not found for deletion', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      // Mock the existence check returning null
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/certificates/nonexistent', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ certificateId: 'nonexistent' }) });

      expect(response.status).toBe(404);
    });
  });
});
