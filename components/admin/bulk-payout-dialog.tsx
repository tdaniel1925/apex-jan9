'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { usePayoutActions, PayoutAction } from '@/lib/hooks/use-payout-actions';
import { Progress } from '@/components/ui/progress';

interface Payout {
  id: string;
  amount: number;
  agents: { first_name: string; last_name: string } | null;
  method: string;
}

interface BulkPayoutDialogProps {
  payouts: Payout[];
  action: PayoutAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkPayoutDialog({
  payouts,
  action,
  open,
  onOpenChange,
  onSuccess,
}: BulkPayoutDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({ success: 0, failed: 0 });

  const { bulkProcess, isProcessing } = usePayoutActions(onSuccess);

  useEffect(() => {
    // Reset selections when dialog opens
    if (open) {
      setSelectedIds([]);
      setShowResults(false);
      setProcessingProgress(0);
    }
  }, [open]);

  const handleSelectAll = () => {
    if (selectedIds.length === payouts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(payouts.map((p) => p.id));
    }
  };

  const handleToggle = (payoutId: string) => {
    setSelectedIds((prev) =>
      prev.includes(payoutId)
        ? prev.filter((id) => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const totalSelectedAmount = payouts
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const handleBulkProcess = async () => {
    setProcessingProgress(0);
    setShowResults(false);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    const result = await bulkProcess(selectedIds, action);

    clearInterval(progressInterval);
    setProcessingProgress(100);
    setResults(result);
    setShowResults(true);

    // Close dialog after showing results
    setTimeout(() => {
      if (result.success > 0) {
        onOpenChange(false);
      }
    }, 2000);
  };

  const actionLabel = action === 'process' ? 'Process' : 'Complete';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk {actionLabel} Payouts</DialogTitle>
          <DialogDescription>
            Select the payouts you want to {action}. This action will update all selected payouts.
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.length === payouts.length && payouts.length > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={isProcessing}
                    />
                    <span className="text-sm font-medium">
                      Select All ({selectedIds.length} of {payouts.length})
                    </span>
                  </div>
                  {selectedIds.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Total: {formatCurrency(totalSelectedAmount)}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.includes(payout.id)}
                        onCheckedChange={() => handleToggle(payout.id)}
                        disabled={isProcessing}
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {payout.agents?.first_name} {payout.agents?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payout.method.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(payout.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkProcess}
                disabled={selectedIds.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing {selectedIds.length} Payouts...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {actionLabel} {selectedIds.length} Payouts
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            {results.success > 0 && results.failed === 0 ? (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold">Success!</h3>
                  <p className="text-muted-foreground">
                    {results.success} payout{results.success > 1 ? 's' : ''} {action === 'process' ? 'marked as processing' : 'completed'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold">Partial Success</h3>
                  <p className="text-muted-foreground">
                    {results.success} succeeded, {results.failed} failed
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
