'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, WITHDRAWAL_FEES, MIN_WITHDRAWAL } from '@/lib/engines/wallet-engine';
import { Banknote } from 'lucide-react';

interface WithdrawDialogProps {
  balance: number;
}

type WithdrawMethod = 'ach' | 'wire' | 'check';

export function WithdrawDialog({ balance }: WithdrawDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawMethod>('ach');

  const numericAmount = parseFloat(amount) || 0;
  const fee = WITHDRAWAL_FEES[method];
  const netAmount = numericAmount - fee;
  const minAmount = MIN_WITHDRAWAL[method];

  const isValid =
    numericAmount >= minAmount &&
    numericAmount <= balance &&
    netAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          method,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      setOpen(false);
      setAmount('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={balance < MIN_WITHDRAWAL.ach}>
          <Banknote className="mr-2 h-4 w-4" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Available balance: {formatCurrency(balance)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="method">Withdrawal Method</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as WithdrawMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">
                    ACH Transfer (Free, min {formatCurrency(MIN_WITHDRAWAL.ach)})
                  </SelectItem>
                  <SelectItem value="wire">
                    Wire Transfer ({formatCurrency(WITHDRAWAL_FEES.wire)} fee, min {formatCurrency(MIN_WITHDRAWAL.wire)})
                  </SelectItem>
                  <SelectItem value="check">
                    Check ({formatCurrency(WITHDRAWAL_FEES.check)} fee, min {formatCurrency(MIN_WITHDRAWAL.check)})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={minAmount}
                max={balance}
                placeholder={`Min ${formatCurrency(minAmount)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {numericAmount > 0 && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount</span>
                  <span>{formatCurrency(numericAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fee</span>
                  <span>-{formatCurrency(fee)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>You&apos;ll Receive</span>
                  <span>{formatCurrency(Math.max(0, netAmount))}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
