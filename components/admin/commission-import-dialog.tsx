/**
 * Commission Import Dialog
 * Multi-step dialog for importing commission CSV files
 * Steps: 1. Upload, 2. Column Mapping, 3. Validation Preview, 4. Import Progress
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Download, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseCSVFile,
  autoDetectMapping,
  mapCSVRows,
  downloadCSVTemplate,
  CSVRow,
  CSVColumnMapping,
  ParsedCommissionRow,
} from '@/lib/utils/csv-parser';
import {
  validateCommissionRows,
  downloadErrorReport,
  ValidatedCommissionRow,
  ValidationResult,
} from '@/lib/utils/commission-validator';
import { normalizeCarrier } from '@/lib/utils/csv-parser';
import { ImportPreview } from './import-preview';
import { ImportProgress } from './import-progress';
import { CommissionInsert } from '@/lib/types/database';

interface CommissionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

export function CommissionImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: CommissionImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<CSVColumnMapping>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    isCompleted: false,
    currentBatch: 0,
    totalBatches: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset all state
  const resetDialog = useCallback(() => {
    setStep('upload');
    setFile(null);
    setCSVData([]);
    setHeaders([]);
    setMapping({});
    setValidationResult(null);
    setImportProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      isCompleted: false,
      currentBatch: 0,
      totalBatches: 0,
    });
  }, []);

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error('Invalid File Type', {
        description: 'Please upload a CSV file.',
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File Too Large', {
        description: 'Maximum file size is 10MB.',
      });
      return;
    }

    setFile(selectedFile);

    // Parse CSV
    const result = await parseCSVFile(selectedFile);

    if (!result.success) {
      toast.error('Failed to Parse CSV', {
        description: result.error || 'An error occurred while parsing the file.',
      });
      setFile(null);
      return;
    }

    if (result.rowCount === 0) {
      toast.error('Empty File', {
        description: 'The CSV file contains no data rows.',
      });
      setFile(null);
      return;
    }

    setCSVData(result.data);
    setHeaders(result.headers);

    // Auto-detect column mapping
    const detectedMapping = autoDetectMapping(result.headers);
    setMapping(detectedMapping);

    toast.success('File Loaded', {
      description: `Loaded ${result.rowCount} rows with ${result.headers.length} columns.`,
    });

    setStep('mapping');
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Validate mapping and move to preview
  const handleMapping = () => {
    // Check all required fields are mapped
    const requiredFields: (keyof CSVColumnMapping)[] = [
      'policy_number',
      'agent_id',
      'carrier',
      'premium_amount',
      'commission_rate',
      'policy_date',
    ];

    const missingFields = requiredFields.filter((field) => !mapping[field]);

    if (missingFields.length > 0) {
      toast.error('Incomplete Mapping', {
        description: `Please map all required fields: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Map CSV rows to commission data
    const mapped = mapCSVRows(csvData, mapping as CSVColumnMapping);

    // Validate all rows
    const validation = validateCommissionRows(mapped);
    setValidationResult(validation);

    toast.success('Data Validated', {
      description: `${validation.validCount} valid rows, ${validation.invalidCount} with errors.`,
    });

    setStep('preview');
  };

  // Start import process
  const handleStartImport = async () => {
    if (!validationResult) return;

    setStep('importing');

    const validRows = validationResult.valid;
    const batchSize = 100;
    const totalBatches = Math.ceil(validRows.length / batchSize);

    setImportProgress({
      total: validRows.length,
      processed: 0,
      successful: 0,
      failed: 0,
      isCompleted: false,
      currentBatch: 0,
      totalBatches,
    });

    let processed = 0;
    let successful = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      setImportProgress((prev) => ({ ...prev, currentBatch }));

      try {
        // Prepare commission data
        const commissionsToImport: CommissionInsert[] = batch.map((row) => ({
          agent_id: row.agent_id.trim(),
          carrier: normalizeCarrier(row.carrier.trim())!,
          policy_number: row.policy_number.trim(),
          premium_amount: parseFloat(row.premium_amount),
          commission_rate: parseFloat(row.commission_rate),
          commission_amount: parseFloat(row.premium_amount) * parseFloat(row.commission_rate),
          policy_date: row.policy_date.trim(),
          status: 'pending',
          source: 'manual_import', // Mark source for multi-source tracking
          bonus_volume: 0, // Manual imports don't have BV (insurance commissions)
        }));

        // Call API to import batch
        const response = await fetch('/api/admin/commissions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commissions: commissionsToImport }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import batch');
        }

        const result = await response.json();
        successful += result.imported || batch.length;
        failed += result.failed || 0;
      } catch (error) {
        console.error('Batch import error:', error);
        failed += batch.length;
      }

      processed += batch.length;

      setImportProgress((prev) => ({
        ...prev,
        processed,
        successful,
        failed,
      }));

      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < validRows.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Mark as completed
    setImportProgress((prev) => ({ ...prev, isCompleted: true }));

    if (successful > 0) {
      toast.success('Import Complete', {
        description: `Successfully imported ${successful} of ${validRows.length} commissions.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    }

    if (failed > 0) {
      toast.error('Some Imports Failed', {
        description: `${failed} commissions failed to import.`,
      });
    }
  };

  // Close dialog and reset
  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation completes
    setTimeout(resetDialog, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Commissions</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import commission records in bulk.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Drop your CSV file here</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                or click to browse (Max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
              />
              <div className="mt-4 flex justify-center gap-2">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Select File
                </Button>
                <Button variant="outline" onClick={downloadCSVTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Expected CSV format:</strong> policy_number, agent_id, carrier, premium_amount, commission_rate, policy_date
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-900">
                File loaded: <strong>{file?.name}</strong> ({csvData.length} rows)
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">Map CSV columns to commission fields:</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Policy Number *</Label>
                  <Select
                    value={mapping.policy_number || ''}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, policy_number: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Agent ID *</Label>
                  <Select
                    value={mapping.agent_id || ''}
                    onValueChange={(value) => setMapping({ ...mapping, agent_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Carrier *</Label>
                  <Select
                    value={mapping.carrier || ''}
                    onValueChange={(value) => setMapping({ ...mapping, carrier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Premium Amount *</Label>
                  <Select
                    value={mapping.premium_amount || ''}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, premium_amount: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Commission Rate *</Label>
                  <Select
                    value={mapping.commission_rate || ''}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, commission_rate: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Policy Date *</Label>
                  <Select
                    value={mapping.policy_date || ''}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, policy_date: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleMapping}>
                Next: Preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && validationResult && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Validation Summary:</strong> {validationResult.validCount} valid rows, {validationResult.invalidCount} with errors
              </p>
            </div>

            <ImportPreview rows={[...validationResult.valid, ...validationResult.invalid]} />

            {validationResult.invalidCount > 0 && (
              <Button
                variant="outline"
                onClick={() => downloadErrorReport(validationResult.invalid)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Error Report
              </Button>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStartImport}
                  disabled={validationResult.validCount === 0}
                >
                  Import {validationResult.validCount} Rows
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === 'importing' && (
          <div className="space-y-6">
            <ImportProgress {...importProgress} />

            {importProgress.isCompleted && (
              <div className="flex justify-end gap-2">
                {validationResult && validationResult.invalidCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => downloadErrorReport(validationResult.invalid)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Report
                  </Button>
                )}
                <Button onClick={handleClose}>Close</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
