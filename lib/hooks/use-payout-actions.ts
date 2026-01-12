import { useState } from 'react';
import { toast } from 'sonner';

export type PayoutAction = 'process' | 'complete';

interface UsePayoutActionsReturn {
  processPayout: (payoutId: string, agentName: string, amount: number) => Promise<void>;
  completePayout: (payoutId: string, agentName: string, amount: number) => Promise<void>;
  bulkProcess: (payoutIds: string[], action: PayoutAction) => Promise<{ success: number; failed: number }>;
  isProcessing: boolean;
  processingId: string | null;
}

export function usePayoutActions(onSuccess?: () => void): UsePayoutActionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const processPayout = async (payoutId: string, agentName: string, amount: number) => {
    setIsProcessing(true);
    setProcessingId(payoutId);

    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payout');
      }

      toast.success(`Payout Processing`, {
        description: `$${amount.toFixed(2)} payout for ${agentName} is now being processed.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Failed to Process', {
        description: error instanceof Error ? error.message : 'An error occurred while processing the payout',
      });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const completePayout = async (payoutId: string, agentName: string, amount: number) => {
    setIsProcessing(true);
    setProcessingId(payoutId);

    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete payout');
      }

      toast.success(`Payout Completed`, {
        description: `$${amount.toFixed(2)} payout for ${agentName} has been completed.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error completing payout:', error);
      toast.error('Failed to Complete', {
        description: error instanceof Error ? error.message : 'An error occurred while completing the payout',
      });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const bulkProcess = async (payoutIds: string[], action: PayoutAction): Promise<{ success: number; failed: number }> => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/payouts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payout_ids: payoutIds, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bulk process payouts');
      }

      const data = await response.json();
      const { summary } = data;

      if (summary.success > 0) {
        toast.success(`Bulk ${action === 'process' ? 'Processing' : 'Completed'}`, {
          description: `${summary.success} of ${summary.total} payouts ${action === 'process' ? 'marked as processing' : 'completed'}.${summary.errors > 0 ? ` ${summary.errors} failed.` : ''}`,
        });
      }

      if (summary.errors > 0 && summary.success === 0) {
        toast.error('Bulk Operation Failed', {
          description: `All ${summary.total} payouts failed to ${action}.`,
        });
      }

      if (onSuccess) {
        onSuccess();
      }

      return { success: summary.success, failed: summary.errors };
    } catch (error) {
      console.error('Error bulk processing payouts:', error);
      toast.error('Bulk Operation Failed', {
        description: error instanceof Error ? error.message : 'An error occurred during bulk processing',
      });
      return { success: 0, failed: payoutIds.length };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayout,
    completePayout,
    bulkProcess,
    isProcessing,
    processingId,
  };
}
