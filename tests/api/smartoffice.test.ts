/**
 * SmartOffice API Route Tests
 * Tests for all SmartOffice admin API endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Create chainable mock for Supabase query builder
const createQueryMock = (finalData: unknown, count = 0) => {
  const mock: Record<string, unknown> = {};
  const chainMethods = ['select', 'order', 'is', 'not', 'or', 'eq', 'range', 'limit', 'single', 'insert', 'update', 'upsert', 'delete'];

  chainMethods.forEach((method) => {
    mock[method] = vi.fn(() => mock);
  });

  // Terminal methods
  mock.single = vi.fn(() => Promise.resolve({ data: finalData, error: null }));
  mock.range = vi.fn(() => Promise.resolve({ data: finalData, error: null, count }));

  // Make then-able for await
  mock.then = (resolve: (value: unknown) => void) =>
    Promise.resolve({ data: finalData, error: null, count }).then(resolve);

  return mock;
};

// Mock Supabase client
vi.mock('@/lib/db/supabase-server', () => ({
  createUntypedAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'smartoffice_sync_config') {
        return createQueryMock(mockConfig);
      }
      if (table === 'smartoffice_agents') {
        return createQueryMock(mockAgents, 2);
      }
      if (table === 'smartoffice_sync_logs') {
        return createQueryMock(mockLogs, 1);
      }
      return createQueryMock(null);
    }),
  })),
}));

// Mock admin auth
vi.mock('@/lib/auth/admin-auth', () => ({
  verifyAdmin: vi.fn(() => Promise.resolve({ userId: 'admin-123', email: 'admin@test.com' })),
  forbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })),
  badRequestResponse: vi.fn((msg, details) => new Response(JSON.stringify({ message: msg, details }), { status: 400 })),
  serverErrorResponse: vi.fn((msg) => new Response(JSON.stringify({ error: msg || 'Server error' }), { status: 500 })),
}));

// Mock SmartOffice services
vi.mock('@/lib/smartoffice', () => ({
  getSmartOfficeSyncService: vi.fn(() => ({
    getSyncStats: vi.fn(() => Promise.resolve({
      totalAgents: 10,
      mappedAgents: 8,
      unmappedAgents: 2,
      totalPolicies: 50,
      totalCommissions: 100,
      lastSync: '2026-01-12T10:00:00Z',
      nextSync: '2026-01-12T16:00:00Z',
    })),
    getSyncLogs: vi.fn(() => Promise.resolve(mockLogs)),
    fullSync: vi.fn(() => Promise.resolve({
      agents: { synced: 10, created: 2, updated: 8, errors: [] },
      policies: { synced: 50, created: 5, errors: [] },
      commissions: { synced: 100, created: 10, errors: [] },
      duration_ms: 5000,
    })),
    mapAgent: vi.fn(() => Promise.resolve()),
    unmapAgent: vi.fn(() => Promise.resolve()),
  })),
  testSmartOfficeCredentials: vi.fn(() => Promise.resolve({ success: true, message: 'Connected' })),
  resetSmartOfficeClient: vi.fn(),
  getSmartOfficeClient: vi.fn(() => Promise.resolve({
    sendRawRequest: vi.fn(() => Promise.resolve({
      rawXml: '<response><status>success</status></response>',
      parsed: { success: true, status: 'success' },
    })),
  })),
}));

// Mock data
const mockConfig = {
  id: 'config-1',
  api_url: 'https://api.smartoffice.com',
  sitename: 'TESTSITE',
  username: 'testuser',
  api_key: 'test-api-key-1234',
  api_secret: 'test-secret-5678',
  is_active: true,
  sync_frequency_hours: 6,
  webhook_enabled: false,
  webhook_secret: null,
};

const mockAgents = [
  {
    id: 'agent-1',
    smartoffice_id: 'SO.1.123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@test.com',
    apex_agent_id: null,
    apex_agent: null,
  },
  {
    id: 'agent-2',
    smartoffice_id: 'SO.1.456',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@test.com',
    apex_agent_id: 'apex-123',
    apex_agent: { id: 'apex-123', first_name: 'Jane', last_name: 'Smith', email: 'jane@apex.com' },
  },
];

const mockLogs = [
  {
    id: 'log-1',
    sync_type: 'full',
    status: 'completed',
    started_at: '2026-01-12T10:00:00Z',
    completed_at: '2026-01-12T10:05:00Z',
    duration_ms: 300000,
    agents_synced: 10,
    agents_created: 2,
    policies_synced: 50,
    error_count: 0,
  },
];

describe('SmartOffice API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/admin/smartoffice', () => {
    it('should return config and stats for authenticated admin', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('config');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('isConfigured');
    });

    it('should mask sensitive fields in config', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/route');

      const response = await GET();
      const data = await response.json();

      // API key and secret should be masked
      if (data.config) {
        expect(data.config.api_key).toMatch(/^••••/);
        expect(data.config.api_secret).toMatch(/^••••/);
      }
    });
  });

  describe('POST /api/admin/smartoffice', () => {
    it('should save valid config', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice', {
        method: 'POST',
        body: JSON.stringify({
          sitename: 'TESTSITE',
          username: 'testuser',
          api_key: 'new-key',
          api_secret: 'new-secret',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid config', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice', {
        method: 'POST',
        body: JSON.stringify({
          sitename: '', // Invalid - required
          username: 'testuser',
          api_key: 'key',
          api_secret: 'secret',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/smartoffice/agents', () => {
    it('should return paginated agents', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/agents/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/agents?page=1&limit=20');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('agents');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it('should filter by mapped status', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/agents/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/agents?filter=unmapped');

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/smartoffice/agents', () => {
    it('should map agent successfully', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/agents/route');

      const bodyContent = {
        smartoffice_agent_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        apex_agent_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      };

      const request = new NextRequest('http://localhost/api/admin/smartoffice/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyContent),
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status !== 200) {
        console.log('Map agent error:', data);
        console.log('Body sent:', bodyContent);
        console.log('Field errors:', JSON.stringify(data.details?.fieldErrors, null, 2));
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should unmap agent when apex_agent_id is null', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/agents/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartoffice_agent_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          apex_agent_id: null,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('unmapped');
    });
  });

  describe('GET /api/admin/smartoffice/logs', () => {
    it('should return sync logs', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/logs/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/logs');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('logs');
      expect(data).toHaveProperty('pagination');
    });

    it('should filter by status', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/logs/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/logs?status=completed');

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/smartoffice/sync', () => {
    it('should trigger full sync', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/sync/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/sync', {
        method: 'POST',
        body: JSON.stringify({ type: 'full' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('result');
    });
  });

  describe('GET /api/admin/smartoffice/dictionary', () => {
    it('should return known objects and properties', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/dictionary/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('objects');
      expect(data.objects).toHaveProperty('Agent');
      expect(data.objects).toHaveProperty('Policy');
    });
  });

  describe('POST /api/admin/smartoffice/dictionary', () => {
    it('should test property existence', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/dictionary/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/dictionary', {
        method: 'POST',
        body: JSON.stringify({
          object: 'Agent',
          property: 'Status',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('object');
      expect(data).toHaveProperty('property');
      expect(data).toHaveProperty('recommendation');
    });
  });

  describe('GET /api/admin/smartoffice/samples', () => {
    it('should return sample requests', async () => {
      const { GET } = await import('@/app/api/admin/smartoffice/samples/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('samples');
      expect(data).toHaveProperty('categories');
      expect(Array.isArray(data.samples)).toBe(true);
      expect(data.samples.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/admin/smartoffice/explorer', () => {
    it('should execute XML request', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/explorer/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/explorer', {
        method: 'POST',
        body: JSON.stringify({
          xml: `<?xml version="1.0"?><request><method><GetSystemTime/></method></request>`,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('responseXml');
      expect(data).toHaveProperty('parsedResponse');
      expect(data).toHaveProperty('executionTime');
    });

    it('should reject empty XML', async () => {
      const { POST } = await import('@/app/api/admin/smartoffice/explorer/route');

      const request = new NextRequest('http://localhost/api/admin/smartoffice/explorer', {
        method: 'POST',
        body: JSON.stringify({ xml: '' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});

describe('SmartOffice Cron Endpoint', () => {
  it('should reject unauthorized requests', async () => {
    const { POST } = await import('@/app/api/cron/smartoffice-sync/route');

    const request = new NextRequest('http://localhost/api/cron/smartoffice-sync', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
