/**
 * Commission Validator Utility
 * Validates commission data before import
 */

import { CARRIERS } from '@/lib/config/carriers';
import { normalizeCarrier, ParsedCommissionRow } from './csv-parser';

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ValidatedCommissionRow extends ParsedCommissionRow {
  row: number;
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationResult {
  valid: ValidatedCommissionRow[];
  invalid: ValidatedCommissionRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  errorSummary: Record<string, number>;
}

/**
 * Validate a single commission row
 */
export function validateCommissionRow(
  row: ParsedCommissionRow,
  rowIndex: number
): ValidatedCommissionRow {
  const errors: ValidationError[] = [];

  // Validate policy number
  if (!row.policy_number || row.policy_number.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'policy_number',
      value: row.policy_number,
      message: 'Policy number is required',
    });
  } else if (row.policy_number.length < 3) {
    errors.push({
      row: rowIndex,
      field: 'policy_number',
      value: row.policy_number,
      message: 'Policy number too short (minimum 3 characters)',
    });
  }

  // Validate agent ID (UUID format)
  if (!row.agent_id || row.agent_id.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'agent_id',
      value: row.agent_id,
      message: 'Agent ID is required',
    });
  } else {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(row.agent_id.trim())) {
      errors.push({
        row: rowIndex,
        field: 'agent_id',
        value: row.agent_id,
        message: 'Agent ID must be a valid UUID',
      });
    }
  }

  // Validate carrier
  if (!row.carrier || row.carrier.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'carrier',
      value: row.carrier,
      message: 'Carrier is required',
    });
  } else {
    const normalizedCarrier = normalizeCarrier(row.carrier.trim());
    if (!normalizedCarrier) {
      errors.push({
        row: rowIndex,
        field: 'carrier',
        value: row.carrier,
        message: `Invalid carrier. Must be one of: ${CARRIERS.join(', ')}`,
      });
    }
  }

  // Validate premium amount
  const premium = parseFloat(row.premium_amount);
  if (isNaN(premium)) {
    errors.push({
      row: rowIndex,
      field: 'premium_amount',
      value: row.premium_amount,
      message: 'Premium amount must be a valid number',
    });
  } else if (premium <= 0) {
    errors.push({
      row: rowIndex,
      field: 'premium_amount',
      value: row.premium_amount,
      message: 'Premium amount must be greater than zero',
    });
  } else if (premium > 10000000) {
    errors.push({
      row: rowIndex,
      field: 'premium_amount',
      value: row.premium_amount,
      message: 'Premium amount exceeds maximum allowed ($10,000,000)',
    });
  }

  // Validate commission rate
  const rate = parseFloat(row.commission_rate);
  if (isNaN(rate)) {
    errors.push({
      row: rowIndex,
      field: 'commission_rate',
      value: row.commission_rate,
      message: 'Commission rate must be a valid number',
    });
  } else if (rate < 0 || rate > 1) {
    errors.push({
      row: rowIndex,
      field: 'commission_rate',
      value: row.commission_rate,
      message: 'Commission rate must be between 0 and 1 (0% to 100%)',
    });
  }

  // Validate policy date
  if (!row.policy_date || row.policy_date.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'policy_date',
      value: row.policy_date,
      message: 'Policy date is required',
    });
  } else {
    const date = new Date(row.policy_date.trim());
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowIndex,
        field: 'policy_date',
        value: row.policy_date,
        message: 'Policy date must be a valid date (YYYY-MM-DD)',
      });
    } else {
      const now = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(now.getFullYear() + 1);

      if (date > maxFutureDate) {
        errors.push({
          row: rowIndex,
          field: 'policy_date',
          value: row.policy_date,
          message: 'Policy date cannot be more than 1 year in the future',
        });
      }

      const minPastDate = new Date();
      minPastDate.setFullYear(now.getFullYear() - 10);

      if (date < minPastDate) {
        errors.push({
          row: rowIndex,
          field: 'policy_date',
          value: row.policy_date,
          message: 'Policy date cannot be more than 10 years in the past',
        });
      }
    }
  }

  return {
    ...row,
    row: rowIndex,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all commission rows
 */
export function validateCommissionRows(
  rows: ParsedCommissionRow[]
): ValidationResult {
  const validated = rows.map((row, index) => validateCommissionRow(row, index + 1));

  const valid = validated.filter((row) => row.isValid);
  const invalid = validated.filter((row) => !row.isValid);

  // Generate error summary
  const errorSummary: Record<string, number> = {};
  invalid.forEach((row) => {
    row.errors.forEach((error) => {
      const key = error.field;
      errorSummary[key] = (errorSummary[key] || 0) + 1;
    });
  });

  return {
    valid,
    invalid,
    totalRows: rows.length,
    validCount: valid.length,
    invalidCount: invalid.length,
    errorSummary,
  };
}

/**
 * Check for duplicate policy numbers in the import
 */
export function findDuplicatePolicyNumbers(
  rows: ParsedCommissionRow[]
): Map<string, number[]> {
  const policyNumberMap = new Map<string, number[]>();

  rows.forEach((row, index) => {
    const policyNumber = row.policy_number.trim();
    if (!policyNumberMap.has(policyNumber)) {
      policyNumberMap.set(policyNumber, []);
    }
    policyNumberMap.get(policyNumber)!.push(index + 1);
  });

  // Filter to only duplicates
  const duplicates = new Map<string, number[]>();
  policyNumberMap.forEach((rows, policyNumber) => {
    if (rows.length > 1) {
      duplicates.set(policyNumber, rows);
    }
  });

  return duplicates;
}

/**
 * Generate error CSV for download
 */
export function generateErrorCSV(invalidRows: ValidatedCommissionRow[]): string {
  const headers = [
    'Row',
    'Policy Number',
    'Agent ID',
    'Carrier',
    'Premium Amount',
    'Commission Rate',
    'Policy Date',
    'Errors',
  ];

  const rows = invalidRows.map((row) => {
    const errorMessages = row.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    return [
      row.row.toString(),
      row.policy_number,
      row.agent_id,
      row.carrier,
      row.premium_amount,
      row.commission_rate,
      row.policy_date,
      `"${errorMessages}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download error report CSV
 */
export function downloadErrorReport(invalidRows: ValidatedCommissionRow[]): void {
  const csv = generateErrorCSV(invalidRows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  link.download = `commission-import-errors-${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
