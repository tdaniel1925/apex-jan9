import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePayoutActions } from '@/lib/hooks/use-payout-actions';
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

describe('usePayoutActions', () => {
  const mockPayoutId = 'payout-123';
  const mockAgentName = 'John Doe';
  const mockAmount = 500.00;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processPayout', () => {
    it('should successfully process a payout', async () => {
      const mockOnSuccess = vi.fn();
      const mockResponse = {
        success: true,
        payout: { id: mockPayoutId, status: 'processing' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingId).toBeNull();

      await act(async () => {
        await result.current.processPayout(mockPayoutId, mockAgentName, mockAmount);
      });

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/payouts/${mockPayoutId}/process`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Verify success toast was shown
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Payout Processing',
          {
            description: `$${mockAmount.toFixed(2)} payout for ${mockAgentName} is now being processed.`,
          }
        );
      });

      // Verify onSuccess callback was called
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);

      // Verify processing state is reset
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingId).toBeNull();
    });

    it('should handle process errors', async () => {
      const mockOnSuccess = vi.fn();
      const mockError = { error: 'Payout not found' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      await act(async () => {
        await result.current.processPayout(mockPayoutId, mockAgentName, mockAmount);
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to Process',
          {
            description: 'Payout not found',
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

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      await act(async () => {
        await result.current.processPayout(mockPayoutId, mockAgentName, mockAmount);
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to Process',
          {
            description: 'Network error',
          }
        );
      });

      // Verify onSuccess was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('completePayout', () => {
    it('should successfully complete a payout', async () => {
      const mockOnSuccess = vi.fn();
      const mockResponse = {
        success: true,
        payout: { id: mockPayoutId, status: 'completed' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      await act(async () => {
        await result.current.completePayout(mockPayoutId, mockAgentName, mockAmount);
      });

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/payouts/${mockPayoutId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Verify success toast was shown
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Payout Completed',
          {
            description: `$${mockAmount.toFixed(2)} payout for ${mockAgentName} has been completed.`,
          }
        );
      });

      // Verify onSuccess callback was called
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('should handle complete errors', async () => {
      const mockOnSuccess = vi.fn();
      const mockError = { error: 'Unauthorized' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      await act(async () => {
        await result.current.completePayout(mockPayoutId, mockAgentName, mockAmount);
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to Complete',
          {
            description: 'Unauthorized',
          }
        );
      });

      // Verify onSuccess was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('bulkProcess', () => {
    it('should successfully process multiple payouts', async () => {
      const mockOnSuccess = vi.fn();
      const mockPayoutIds = ['payout-1', 'payout-2', 'payout-3'];
      const mockResponse = {
        summary: {
          total: 3,
          success: 3,
          errors: 0,
          action: 'process',
        },
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkProcess(mockPayoutIds, 'process');
      });

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/payouts/bulk',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payout_ids: mockPayoutIds,
            action: 'process',
          }),
        }
      );

      // Verify result returned
      expect(bulkResult).toEqual({ success: 3, failed: 0 });

      // Verify onSuccess callback was called
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failures in bulk process', async () => {
      const mockOnSuccess = vi.fn();
      const mockPayoutIds = ['payout-1', 'payout-2', 'payout-3'];
      const mockResponse = {
        summary: {
          total: 3,
          success: 2,
          errors: 1,
          action: 'process',
        },
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkProcess(mockPayoutIds, 'process');
      });

      // Verify result includes failures
      expect(bulkResult).toEqual({ success: 2, failed: 1 });

      // Still call onSuccess even with partial failures
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('should handle bulk process errors', async () => {
      const mockOnSuccess = vi.fn();
      const mockPayoutIds = ['payout-1', 'payout-2'];
      const mockError = { error: 'Bulk operation failed' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => usePayoutActions(mockOnSuccess));

      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkProcess(mockPayoutIds, 'process');
      });

      // Verify error result
      expect(bulkResult).toEqual({ success: 0, failed: mockPayoutIds.length });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Bulk Operation Failed',
          {
            description: 'Bulk operation failed',
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

      const { result } = renderHook(() => usePayoutActions());

      // Start process action
      act(() => {
        result.current.processPayout(mockPayoutId, mockAgentName, mockAmount);
      });

      // Check processing state is set immediately
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
        expect(result.current.processingId).toBe(mockPayoutId);
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
