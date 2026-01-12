/**
 * Import Preview Component
 * Shows a preview table of parsed commission data with validation errors
 */

'use client';

import { ValidatedCommissionRow } from '@/lib/utils/commission-validator';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { CARRIER_CONFIG } from '@/lib/config/carriers';
import { normalizeCarrier } from '@/lib/utils/csv-parser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
interface ImportPreviewProps {
  rows: ValidatedCommissionRow[];
  maxRows?: number;
}

export function ImportPreview({ rows, maxRows = 10 }: ImportPreviewProps) {
  const previewRows = rows.slice(0, maxRows);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {previewRows.length} of {rows.length} rows
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              {rows.filter((r) => r.isValid).length} valid
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">
              {rows.filter((r) => !r.isValid).length} with errors
            </span>
          </div>
        </div>
      </div>

      <div className="h-[400px] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Row</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Policy #</TableHead>
              <TableHead>Agent ID</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row) => {
              const premiumAmount = parseFloat(row.premium_amount) || 0;
              const commissionRate = parseFloat(row.commission_rate) || 0;
              const commissionAmount = premiumAmount * commissionRate;
              const carrier = normalizeCarrier(row.carrier);

              return (
                <TableRow
                  key={row.row}
                  className={row.isValid ? '' : 'bg-red-50'}
                >
                  <TableCell className="font-medium">{row.row}</TableCell>
                  <TableCell>
                    {row.isValid ? (
                      <Badge variant="outline" className="gap-1 bg-green-50">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {row.errors.length} error{row.errors.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.policy_number}
                    {row.errors.some((e) => e.field === 'policy_number') && (
                      <p className="text-xs text-red-600 mt-1">
                        {row.errors.find((e) => e.field === 'policy_number')?.message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.agent_id.length > 16 ? `${row.agent_id.slice(0, 8)}...` : row.agent_id}
                    {row.errors.some((e) => e.field === 'agent_id') && (
                      <p className="text-xs text-red-600 mt-1">
                        {row.errors.find((e) => e.field === 'agent_id')?.message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {carrier ? (
                      <Badge variant="outline">
                        {CARRIER_CONFIG[carrier]?.shortName || row.carrier}
                      </Badge>
                    ) : (
                      <span className="text-sm text-red-600">{row.carrier}</span>
                    )}
                    {row.errors.some((e) => e.field === 'carrier') && (
                      <p className="text-xs text-red-600 mt-1">
                        {row.errors.find((e) => e.field === 'carrier')?.message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {isNaN(premiumAmount) ? (
                      <span className="text-sm text-red-600">{row.premium_amount}</span>
                    ) : (
                      formatCurrency(premiumAmount)
                    )}
                    {row.errors.some((e) => e.field === 'premium_amount') && (
                      <p className="text-xs text-red-600 mt-1">
                        {row.errors.find((e) => e.field === 'premium_amount')?.message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {isNaN(commissionRate) ? (
                      <span className="text-sm text-red-600">{row.commission_rate}</span>
                    ) : (
                      `${(commissionRate * 100).toFixed(1)}%`
                    )}
                    {row.errors.some((e) => e.field === 'commission_rate') && (
                      <p className="text-xs text-red-600 mt-1">
                        {row.errors.find((e) => e.field === 'commission_rate')?.message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {!isNaN(premiumAmount) && !isNaN(commissionRate) ? (
                      formatCurrency(commissionAmount)
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {row.policy_date}
                    {row.errors.some((e) => e.field === 'policy_date') && (
                      <p className="text-xs text-red-600 mt-1">
                        {row.errors.find((e) => e.field === 'policy_date')?.message}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {rows.length > maxRows && (
        <p className="text-xs text-muted-foreground text-center">
          Showing first {maxRows} rows. All {rows.length} rows will be validated on import.
        </p>
      )}
    </div>
  );
}
