/**
 * Admin Agents API Tests
 * Tests for GET and POST /api/admin/agents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/agents/route';
import { createMockAgent, mockAdminUser } from '../../helpers/mocks';

// Mock the admin auth module
vi.mock('@/lib/auth/admin-auth', () => ({
  verifyAdmin: vi.fn(),
  forbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })),
  badRequestResponse: vi.fn((msg, details) => new Response(JSON.stringify({ error: msg, details }), { status: 400 })),
  serverErrorResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })),
}));

// Mock the supabase server module
vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(),
}));

// Mock the workflow
vi.mock('@/lib/workflows/on-agent-registered', () => ({
  onAgentRegistered: vi.fn().mockResolvedValue({ success: true }),
}));

// Import mocked modules
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { createAdminClient } from '@/lib/db/supabase-server';

describe('Admin Agents API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/agents', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/agents');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return paginated agents list for admin user', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockAgents = [createMockAgent(), createMockAgent({ id: 'agent-456' })];

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: typeof mockAgents; error: null; count: number }) => void) => {
            resolve({ data: mockAgents, error: null, count: 2 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/agents');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('agents');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('stats');
    });

    it('should support filtering by status', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: []; error: null; count: number }) => void) => {
            resolve({ data: [], error: null, count: 0 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/agents?status=active');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockClient.from).toHaveBeenCalledWith('agents');
    });

    it('should return 400 for invalid query parameters', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/agents?limit=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/agents', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/agents', {
        method: 'POST',
        body: JSON.stringify({
          email: 'new@test.com',
          first_name: 'New',
          last_name: 'Agent',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid agent data', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/agents', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email', // Invalid email format
          first_name: 'New',
          last_name: 'Agent',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should create agent when valid data provided', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const newAgent = createMockAgent({
        id: 'new-agent-id',
        email: 'new@test.com',
        first_name: 'New',
        last_name: 'Agent',
      });

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockReturnThis(),
        })),
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-new' } },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
      };

      // Handle the select single for agent lookup
      mockClient.from = vi.fn().mockImplementation((table) => {
        if (table === 'agents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newAgent, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/agents', {
        method: 'POST',
        body: JSON.stringify({
          email: 'new@test.com',
          first_name: 'New',
          last_name: 'Agent',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});
