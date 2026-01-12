import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBonusActions } from '@/lib/hooks/use-bonus-actions';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('useBonusActions', () => {
  const mockBonusId = 'bonus-123';
  const mockAgentName = 'John Doe';
  const mockAmount = 500.00;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('approveBonus', () => {
    it('should successfully approve a bonus', async () => {
      const mockOnSuccess = vi.fn();
      const mockResponse = {
        success: true,
        bonus: { id: mockBonusId, status: 'approved' },
        wallet_credited: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useBonusActions(mockOnSuccess));

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingId).toBeNull();

      await act(async () => {
        await result.current.approveBonus(mockBonusId, mockAgentName, mockAmount);
      });

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/bonuses/${mockBonusId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'approved' }),
        }
      );

      // Verify success toast was shown
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Bonus Approved',
          {
            description: `$${mockAmount.toFixed(2)} bonus for ${mockAgentName} has been approved and wallet credited.`,
          }
        );
      });

      // Verify onSuccess callback was called
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);

      // Verify processing state is reset
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingId).toBeNull();
    });

    it('should handle approval errors', async () => {
      const mockOnSuccess = vi.fn();
      const mockError = { error: 'Bonus not found' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useBonusActions(mockOnSuccess));

      await act(async () => {
        await result.current.approveBonus(mockBonusId, mockAgentName, mockAmount);
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to Approve',
          {
            description: 'Bonus not found',
          }
        );
      });

      // Verify onSuccess was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();

      // Verify processing state is reset
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingId).toBeNull();
    });

    it('should handle network errors', async () => {
      const mockOnSuccess = vi.fn();

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBonusActions(mockOnSuccess));

      await act(async () => {
        await result.current.approveBonus(mockBonusId, mockAgentName, mockAmount);
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to Approve',
          {
            description: 'Network error',
          }
        );
      });

      // Verify onSuccess was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('denyBonus', () => {
    it('should successfully deny a bonus', async () => {
      const mockOnSuccess = vi.fn();
      const mockResponse = {
        success: true,
        bonus: { id: mockBonusId, status: 'cancelled' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useBonusActions(mockOnSuccess));

      await act(async () => {
        await result.current.denyBonus(mockBonusId, mockAgentName, mockAmount);
      });

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/bonuses/${mockBonusId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        }
      );

      // Verify success toast was shown
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Bonus Denied',
          {
            description: `$${mockAmount.toFixed(2)} bonus for ${mockAgentName} has been cancelled.`,
          }
        );
      });

      // Verify onSuccess callback was called
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('should handle deny errors', async () => {
      const mockOnSuccess = vi.fn();
      const mockError = { error: 'Unauthorized' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useBonusActions(mockOnSuccess));

      await act(async () => {
        await result.current.denyBonus(mockBonusId, mockAgentName, mockAmount);
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to Deny',
          {
            description: 'Unauthorized',
          }
        );
      });

      // Verify onSuccess was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('processing state', () => {
    it('should track processing state correctly', async () => {
      let resolveFetch: any;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as any).mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useBonusActions());

      // Start approve action
      act(() => {
        result.current.approveBonus(mockBonusId, mockAgentName, mockAmount);
      });

      // Check processing state is set immediately
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
        expect(result.current.processingId).toBe(mockBonusId);
      });

      // Resolve the fetch
      await act(async () => {
        resolveFetch({
          ok: true,
          json: async () => ({ success: true }),
        });
        await fetchPromise;
      });

      // Check processing state is reset
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
        expect(result.current.processingId).toBeNull();
      });
    });
  });
});
