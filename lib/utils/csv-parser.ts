/**
 * CSV Parser Utility
 * Handles CSV file parsing with column mapping support
 */

import Papa from 'papaparse';
import { Carrier, CARRIERS } from '@/lib/config/carriers';

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedCommissionRow {
  policy_number: string;
  agent_id: string;
  carrier: string;
  premium_amount: string;
  commission_rate: string;
  policy_date: string;
}

export interface CSVColumnMapping {
  policy_number: string;
  agent_id: string;
  carrier: string;
  premium_amount: string;
  commission_rate: string;
  policy_date: string;
}

export interface ParseResult {
  success: boolean;
  data: CSVRow[];
  headers: string[];
  rowCount: number;
  error?: string;
}

/**
 * Parse CSV file
 * Returns parsed data with headers for column mapping
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            data: [],
            headers: [],
            rowCount: 0,
            error: results.errors[0].message,
          });
          return;
        }

        const headers = results.meta.fields || [];

        resolve({
          success: true,
          data: results.data,
          headers,
          rowCount: results.data.length,
        });
      },
      error: (error: Error) => {
        resolve({
          success: false,
          data: [],
          headers: [],
          rowCount: 0,
          error: error.message,
        });
      },
    });
  });
}

/**
 * Auto-detect column mapping based on common header patterns
 */
export function autoDetectMapping(headers: string[]): Partial<CSVColumnMapping> {
  const mapping: Partial<CSVColumnMapping> = {};

  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // Policy number patterns
  const policyPatterns = ['policy', 'policy_number', 'policynumber', 'policy_num', 'number'];
  const policyIndex = lowerHeaders.findIndex((h) =>
    policyPatterns.some((p) => h.includes(p))
  );
  if (policyIndex !== -1) mapping.policy_number = headers[policyIndex];

  // Agent ID patterns
  const agentPatterns = ['agent_id', 'agentid', 'agent', 'writing_agent', 'producer_id'];
  const agentIndex = lowerHeaders.findIndex((h) =>
    agentPatterns.some((p) => h.includes(p))
  );
  if (agentIndex !== -1) mapping.agent_id = headers[agentIndex];

  // Carrier patterns
  const carrierPatterns = ['carrier', 'insurance_carrier', 'company', 'insurer'];
  const carrierIndex = lowerHeaders.findIndex((h) =>
    carrierPatterns.some((p) => h.includes(p))
  );
  if (carrierIndex !== -1) mapping.carrier = headers[carrierIndex];

  // Premium amount patterns
  const premiumPatterns = ['premium', 'premium_amount', 'annual_premium', 'annualized_premium', 'amount'];
  const premiumIndex = lowerHeaders.findIndex((h) =>
    premiumPatterns.some((p) => h.includes(p)) && h.includes('premium')
  );
  if (premiumIndex !== -1) mapping.premium_amount = headers[premiumIndex];

  // Commission rate patterns
  const ratePatterns = ['rate', 'commission_rate', 'commissionrate', 'percentage', 'comm_rate'];
  const rateIndex = lowerHeaders.findIndex((h) =>
    ratePatterns.some((p) => h.includes(p))
  );
  if (rateIndex !== -1) mapping.commission_rate = headers[rateIndex];

  // Policy date patterns
  const datePatterns = ['date', 'policy_date', 'policydate', 'issue_date', 'issuedate', 'effective_date'];
  const dateIndex = lowerHeaders.findIndex((h) =>
    datePatterns.some((p) => h.includes(p))
  );
  if (dateIndex !== -1) mapping.policy_date = headers[dateIndex];

  return mapping;
}

/**
 * Map CSV rows to commission data using column mapping
 */
export function mapCSVRows(
  rows: CSVRow[],
  mapping: CSVColumnMapping
): ParsedCommissionRow[] {
  return rows.map((row) => ({
    policy_number: row[mapping.policy_number] || '',
    agent_id: row[mapping.agent_id] || '',
    carrier: row[mapping.carrier] || '',
    premium_amount: row[mapping.premium_amount] || '0',
    commission_rate: row[mapping.commission_rate] || '0',
    policy_date: row[mapping.policy_date] || '',
  }));
}

/**
 * Normalize carrier name to match our Carrier enum
 */
export function normalizeCarrier(carrierName: string): Carrier | null {
  const normalized = carrierName.toLowerCase().replace(/\s+/g, '_');

  // Check exact match
  if (CARRIERS.includes(normalized as Carrier)) {
    return normalized as Carrier;
  }

  // Check partial matches
  if (normalized.includes('columbus')) return 'columbus_life';
  if (normalized.includes('aig')) return 'aig';
  if (normalized.includes('f+g') || normalized.includes('fg') || normalized.includes('fidelity')) return 'fg';
  if (normalized.includes('moo')) return 'moo';
  if (normalized.includes('nlg') || normalized.includes('national_life')) return 'nlg';
  if (normalized.includes('symetra')) return 'symetra';
  if (normalized.includes('north_american') || normalized.includes('na')) return 'na';

  return null;
}

/**
 * Generate CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = [
    'policy_number',
    'agent_id',
    'carrier',
    'premium_amount',
    'commission_rate',
    'policy_date',
  ];

  const exampleRow = [
    'POL-12345',
    'agent-uuid-here',
    'columbus_life',
    '5000.00',
    '0.50',
    '2024-01-15',
  ];

  const csv = [headers.join(','), exampleRow.join(',')].join('\n');

  return csv;
}

/**
 * Download CSV template file
 */
export function downloadCSVTemplate(): void {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'commission-import-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
