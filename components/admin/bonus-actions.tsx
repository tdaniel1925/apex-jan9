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
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { useBonusActions } from '@/lib/hooks/use-bonus-actions';

interface BonusActionsProps {
  bonusId: string;
  agentName: string;
  amount: number;
  bonusType: string;
  onSuccess?: () => void;
}

export function BonusActions({
  bonusId,
  agentName,
  amount,
  bonusType,
  onSuccess,
}: BonusActionsProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const { approveBonus, denyBonus, isProcessing, processingId } = useBonusActions(onSuccess);

  const handleApprove = async () => {
    await approveBonus(bonusId, agentName, amount);
    setShowApproveDialog(false);
  };

  const handleDeny = async () => {
    await denyBonus(bonusId, agentName, amount);
    setShowDenyDialog(false);
  };

  const isThisProcessing = processingId === bonusId;

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => setShowApproveDialog(true)}
          disabled={isProcessing}
        >
          {isThisProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setShowDenyDialog(true)}
          disabled={isProcessing}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Bonus</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this bonus? The wallet will be credited immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Agent</p>
              <p className="text-base font-semibold">{agentName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Bonus Type</p>
              <p className="text-base">{bonusType.replace(/_/g, ' ')}</p>
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
              onClick={() => setShowApproveDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Bonus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Confirmation Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Bonus</DialogTitle>
            <DialogDescription>
              Are you sure you want to deny this bonus? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Agent</p>
              <p className="text-base font-semibold">{agentName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Bonus Type</p>
              <p className="text-base">{bonusType.replace(/_/g, ' ')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDenyDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeny}
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Denying...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Deny Bonus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
