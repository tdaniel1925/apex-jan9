import { useState } from 'react';
import { toast } from 'sonner';

export type BonusAction = 'approve' | 'deny';

interface UseBonusActionsReturn {
  approveBonus: (bonusId: string, agentName: string, amount: number) => Promise<void>;
  denyBonus: (bonusId: string, agentName: string, amount: number) => Promise<void>;
  isProcessing: boolean;
  processingId: string | null;
}

export function useBonusActions(onSuccess?: () => void): UseBonusActionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const approveBonus = async (bonusId: string, agentName: string, amount: number) => {
    setIsProcessing(true);
    setProcessingId(bonusId);

    try {
      const response = await fetch(`/api/admin/bonuses/${bonusId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve bonus');
      }

      const data = await response.json();

      // Success toast
      toast.success(`Bonus Approved`, {
        description: `$${amount.toFixed(2)} bonus for ${agentName} has been approved and wallet credited.`,
      });

      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error approving bonus:', error);
      toast.error('Failed to Approve', {
        description: error instanceof Error ? error.message : 'An error occurred while approving the bonus',
      });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const denyBonus = async (bonusId: string, agentName: string, amount: number) => {
    setIsProcessing(true);
    setProcessingId(bonusId);

    try {
      const response = await fetch(`/api/admin/bonuses/${bonusId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deny bonus');
      }

      // Success toast
      toast.success(`Bonus Denied`, {
        description: `$${amount.toFixed(2)} bonus for ${agentName} has been cancelled.`,
      });

      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error denying bonus:', error);
      toast.error('Failed to Deny', {
        description: error instanceof Error ? error.message : 'An error occurred while denying the bonus',
      });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  return {
    approveBonus,
    denyBonus,
    isProcessing,
    processingId,
  };
}
