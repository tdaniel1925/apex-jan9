'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { usePayoutActions } from '@/lib/hooks/use-payout-actions';

interface PayoutActionsProps {
  payoutId: string;
  agentName: string;
  amount: number;
  method: string;
  status: string;
  onSuccess?: () => void;
}

export function PayoutActions({
  payoutId,
  agentName,
  amount,
  method,
  status,
  onSuccess,
}: PayoutActionsProps) {
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const { processPayout, completePayout, isProcessing, processingId } = usePayoutActions(onSuccess);

  const handleProcess = async () => {
    await processPayout(payoutId, agentName, amount);
    setShowProcessDialog(false);
  };

  const handleComplete = async () => {
    await completePayout(payoutId, agentName, amount);
    setShowCompleteDialog(false);
  };

  const isThisProcessing = processingId === payoutId;

  // Show different buttons based on status
  if (status === 'pending') {
    return (
      <>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            className="gap-1"
            onClick={() => setShowProcessDialog(true)}
            disabled={isProcessing}
          >
            {isThisProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Process
              </>
            )}
          </Button>
        </div>

        {/* Process Confirmation Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payout</DialogTitle>
              <DialogDescription>
                Mark this payout as processing. This will update the status and notify the agent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Agent</p>
                <p className="text-base font-semibold">{agentName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="text-base">{method}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(amount)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProcessDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Processing
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (status === 'processing') {
    return (
      <>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            className="gap-1 bg-green-600 hover:bg-green-700"
            onClick={() => setShowCompleteDialog(true)}
            disabled={isProcessing}
          >
            {isThisProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete
              </>
            )}
          </Button>
        </div>

        {/* Complete Confirmation Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Payout</DialogTitle>
              <DialogDescription>
                Mark this payout as completed. This confirms the funds have been transferred.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Agent</p>
                <p className="text-base font-semibold">{agentName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="text-base">{method}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(amount)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // For completed/failed status, show no action buttons
  return null;
}
