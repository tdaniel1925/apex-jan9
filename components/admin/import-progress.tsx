/**
 * Import Progress Component
 * Shows progress bar and status during batch commission import
 */

'use client';

import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportProgressProps {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isCompleted: boolean;
  currentBatch?: number;
  totalBatches?: number;
}

export function ImportProgress({
  total,
  processed,
  successful,
  failed,
  isCompleted,
  currentBatch,
  totalBatches,
}: ImportProgressProps) {
  const progressPercentage = total > 0 ? (processed / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {isCompleted ? 'Import Complete' : 'Importing Commissions...'}
          </span>
          <span className="text-muted-foreground">
            {processed} / {total} ({Math.round(progressPercentage)}%)
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        {currentBatch && totalBatches && !isCompleted && (
          <p className="text-xs text-muted-foreground">
            Processing batch {currentBatch} of {totalBatches}
          </p>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          )}
          <div>
            <p className="text-sm font-medium">Processed</p>
            <p className="text-2xl font-bold">{processed}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successful}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failed}</p>
          </div>
        </div>
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Import Complete!</p>
              <p className="text-sm text-green-700 mt-1">
                Successfully imported {successful} of {total} commission records.
                {failed > 0 && (
                  <span className="block mt-1">
                    {failed} record{failed > 1 ? 's' : ''} failed - you can download the error report for details.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
