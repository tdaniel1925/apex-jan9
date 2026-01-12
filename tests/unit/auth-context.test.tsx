/**
 * Auth Context Unit Tests
 * Testing auth context caching and state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';

// Mock Supabase client
vi.mock('@/lib/db/supabase-client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}));

// Mock performance utilities
vi.mock('@/lib/utils/performance', () => ({
  measureAsync: vi.fn((name, fn) => fn()),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.agentLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.agent).toBeNull();
  });

  it('should cache agent data after first fetch', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    };

    const mockAgent = {
      id: 'agent-123',
      user_id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      rank: 'associate',
      status: 'active',
    };

    const { createClient } = await import('@/lib/db/supabase-client');
    const mockSupabase = createClient();

    vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAgent, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Agent should be loaded
    expect(result.current.agent).toEqual(mockAgent);

    // from().select() should have been called once for agent fetch
    expect(mockSupabase.from).toHaveBeenCalledWith('agents');
  });

  it('should provide refreshAgent function', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refreshAgent).toBe('function');

    // Call refreshAgent
    await act(async () => {
      await result.current.refreshAgent();
    });

    // Should complete without error
    expect(result.current.agentLoading).toBe(false);
  });

  it('should clear agent data on signOut', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    };

    const mockAgent = {
      id: 'agent-123',
      user_id: 'user-123',
      email: 'test@example.com',
    };

    const { createClient } = await import('@/lib/db/supabase-client');
    const mockSupabase = createClient();

    vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAgent, error: null }),
        }),
      }),
    } as any);

    vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Agent should be loaded
    expect(result.current.agent).toEqual(mockAgent);

    // Sign out
    await act(async () => {
      await result.current.signOut();
    });

    // Agent should be cleared
    expect(result.current.agent).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should handle agent fetch errors gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    };

    const { createClient } = await import('@/lib/db/supabase-client');
    const mockSupabase = createClient();

    vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should complete loading even with error
    expect(result.current.agentLoading).toBe(false);
    expect(result.current.agent).toBeNull();
  });

  it('should handle signIn errors', async () => {
    const { createClient } = await import('@/lib/db/supabase-client');
    const mockSupabase = createClient();

    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' } as any,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Attempt sign in with invalid credentials
    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
    });

    // Should return error
    expect(signInResult).toEqual({ error: 'Invalid credentials' });
  });

  it('should measure performance of auth operations', async () => {
    const { measureAsync } = await import('@/lib/utils/performance');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Performance monitoring should have been called
    expect(measureAsync).toHaveBeenCalled();
  });
});
