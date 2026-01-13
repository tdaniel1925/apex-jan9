/**
 * Admin Login Page Tests
 * Tests for dual admin authentication (Corporate Staff RBAC + Agent rank-based)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLoginPage from '@/app/admin-login/page';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock auth context
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/db/supabase-client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock fetch for corporate login API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminLoginPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });
  });

  describe('Page Rendering', () => {
    it('should render login page with two tabs', () => {
      render(<AdminLoginPage />);

      expect(screen.getByRole('tab', { name: /corporate staff/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /agent admin/i })).toBeInTheDocument();
    });

    it('should show Corporate Staff tab by default with Sign In button', () => {
      render(<AdminLoginPage />);

      // Corporate Staff tab should be selected by default
      const corporateTab = screen.getByRole('tab', { name: /corporate staff/i });
      expect(corporateTab).toHaveAttribute('data-state', 'active');

      // Should have Sign In button for corporate login
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show admin portal branding', () => {
      render(<AdminLoginPage />);

      expect(screen.getByText('Admin Portal')).toBeInTheDocument();
      expect(screen.getByText('Authorized personnel only')).toBeInTheDocument();
    });
  });

  describe('Corporate Staff Login (RBAC)', () => {
    it('should handle successful corporate login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { token: 'admin-jwt-token' },
        }),
      });

      const { container } = render(<AdminLoginPage />);

      const emailInput = container.querySelector('#corporate-email') as HTMLInputElement;
      const passwordInput = container.querySelector('#corporate-password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'admin@theapexway.net' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/auth/login', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@theapexway.net', password: 'password123' }),
        }));
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin');
      });
    });

    it('should handle corporate login error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid credentials',
        }),
      });

      const { container } = render(<AdminLoginPage />);

      const emailInput = container.querySelector('#corporate-email') as HTMLInputElement;
      const passwordInput = container.querySelector('#corporate-password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show loading state during corporate authentication', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ data: { token: 'token' } }),
      }), 1000)));

      const { container } = render(<AdminLoginPage />);

      const emailInput = container.querySelector('#corporate-email') as HTMLInputElement;
      const passwordInput = container.querySelector('#corporate-password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'admin@theapexway.net' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it('should disable inputs during loading', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ data: { token: 'token' } }),
      }), 1000)));

      const { container } = render(<AdminLoginPage />);

      const emailInput = container.querySelector('#corporate-email') as HTMLInputElement;
      const passwordInput = container.querySelector('#corporate-password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'admin@theapexway.net' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe('Agent Admin Login (Rank-based)', () => {
    it('should switch to agent tab when clicked', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const agentTab = screen.getByRole('tab', { name: /agent admin/i });
      await user.click(agentTab);

      // Agent tab should now be active
      expect(agentTab).toHaveAttribute('data-state', 'active');
    });

    it('should have agent login form after switching tabs', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const agentTab = screen.getByRole('tab', { name: /agent admin/i });
      await user.click(agentTab);

      // Should now have Access Admin Panel button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /access admin panel/i })).toBeInTheDocument();
      });
    });

    it('should call signOut first when logging in via agent tab', async () => {
      const user = userEvent.setup();
      const { container } = render(<AdminLoginPage />);

      mockSignIn.mockResolvedValue({ error: null });
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { rank: 'regional_mga' },
              error: null,
            }),
          }),
        }),
      });

      // Switch to agent tab
      const agentTab = screen.getByRole('tab', { name: /agent admin/i });
      await user.click(agentTab);

      // Wait for agent form to appear
      await waitFor(() => {
        expect(container.querySelector('#agent-email')).toBeInTheDocument();
      });

      const emailInput = container.querySelector('#agent-email') as HTMLInputElement;
      const passwordInput = container.querySelector('#agent-password') as HTMLInputElement;

      await user.type(emailInput, 'agent@example.com');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /access admin panel/i });
      await user.click(submitButton);

      // Should first sign out any existing session
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('should reject non-admin rank agents', async () => {
      const user = userEvent.setup();

      // Set up mocks BEFORE render
      mockSignIn.mockResolvedValue({ error: null });
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { rank: 'associate' }, // Low rank - should be rejected
              error: null,
            }),
          }),
        }),
      });

      const { container } = render(<AdminLoginPage />);

      // Switch to agent tab
      const agentTab = screen.getByRole('tab', { name: /agent admin/i });
      await user.click(agentTab);

      await waitFor(() => {
        expect(container.querySelector('#agent-email')).toBeInTheDocument();
      });

      const emailInput = container.querySelector('#agent-email') as HTMLInputElement;
      const passwordInput = container.querySelector('#agent-password') as HTMLInputElement;

      await user.type(emailInput, 'agent@example.com');
      await user.type(passwordInput, 'password123');

      // Clear mockPush right before submission to ignore any previous calls
      mockPush.mockClear();

      const submitButton = screen.getByRole('button', { name: /access admin panel/i });
      await user.click(submitButton);

      // Should show access denied error
      await waitFor(() => {
        expect(screen.getByText(/access denied.*regional mga or higher required/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // After showing the error, mockPush should NOT have been called with /admin
      expect(mockPush).not.toHaveBeenCalledWith('/admin');
    });

    it('should allow admin rank agents and redirect to /admin', async () => {
      const user = userEvent.setup();
      const { container } = render(<AdminLoginPage />);

      mockSignIn.mockResolvedValue({ error: null });
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { rank: 'regional_mga' }, // Admin rank
              error: null,
            }),
          }),
        }),
      });

      // Switch to agent tab
      const agentTab = screen.getByRole('tab', { name: /agent admin/i });
      await user.click(agentTab);

      await waitFor(() => {
        expect(container.querySelector('#agent-email')).toBeInTheDocument();
      });

      const emailInput = container.querySelector('#agent-email') as HTMLInputElement;
      const passwordInput = container.querySelector('#agent-password') as HTMLInputElement;

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'adminpassword');

      const submitButton = screen.getByRole('button', { name: /access admin panel/i });
      await user.click(submitButton);

      // Should redirect to admin
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin');
      }, { timeout: 5000 });
    });
  });

  describe('Navigation Links', () => {
    it('should have link to agent portal login', () => {
      render(<AdminLoginPage />);

      const agentPortalLink = screen.getByRole('link', { name: /agent portal login/i });
      expect(agentPortalLink).toHaveAttribute('href', '/login');
    });
  });
});
