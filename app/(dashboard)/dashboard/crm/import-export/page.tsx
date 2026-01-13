'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  imported: number;
  duplicates: number;
  errors?: Array<{ row: number; errors: string[] }>;
  message: string;
}

interface ParsedRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  type?: string;
  stage?: string;
  source?: string;
  company?: string;
  job_title?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  tags?: string;
}

export default function CRMImportExportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Preview state
  const [previewData, setPreviewData] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Result state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/crm/bulk');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Contacts exported successfully');
      } else {
        toast.error('Failed to export contacts');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export contacts');
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setPreviewData(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setParseError('No data found in the file');
        return;
      }

      // Validate headers
      const requiredHeaders = ['first_name', 'last_name'];
      const headers = Object.keys(rows[0]);
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setParseError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      setPreviewData(rows);
    } catch (error) {
      console.error('Parse error:', error);
      setParseError('Failed to parse CSV file');
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/crm/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: previewData,
          skipDuplicates,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result);
        if (result.imported > 0) {
          toast.success(result.message);
        }
      } else {
        toast.error(result.error || 'Failed to import contacts');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import contacts');
    } finally {
      setImporting(false);
    }
  };

  const handleClearPreview = () => {
    setPreviewData(null);
    setFileName(null);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `first_name,last_name,email,phone,type,stage,source,company,job_title,address_line1,city,state,zip_code,notes,tags
John,Doe,john@example.com,555-123-4567,lead,new,Website,Acme Corp,Manager,123 Main St,New York,NY,10001,Interested in life insurance,hot;priority
Jane,Smith,jane@example.com,555-987-6543,client,closed_won,Referral,Tech Inc,Director,456 Oak Ave,Los Angeles,CA,90001,Existing customer,vip`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import / Export Contacts</h1>
          <p className="text-muted-foreground">
            Bulk import contacts from CSV or export your contact list
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Contacts
            </CardTitle>
            <CardDescription>
              Download all your contacts as a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export includes all contact fields: name, email, phone, type, stage, source,
              company, address, notes, and tags.
            </p>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Contacts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Contacts
            </CardTitle>
            <CardDescription>
              Upload a CSV file to bulk import contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">CSV File</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={setSkipDuplicates}
              />
              <Label htmlFor="skip-duplicates" className="text-sm">
                Skip duplicate emails
              </Label>
            </div>

            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Parse Error */}
      {parseError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{parseError}</p>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className={importResult.imported > 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {importResult.imported > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-yellow-600 shrink-0" />
              )}
              <div className="space-y-2">
                <p className="font-medium">{importResult.message}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600">{importResult.imported} imported</span>
                  {importResult.duplicates > 0 && (
                    <span className="text-yellow-600">{importResult.duplicates} duplicates skipped</span>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <span className="text-red-600">{importResult.errors.length} errors</span>
                  )}
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-red-800">Errors:</p>
                    <ul className="list-disc list-inside text-red-700">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>Row {err.row}: {err.errors.join(', ')}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preview: {fileName}</CardTitle>
              <CardDescription>
                {previewData.length} contacts found
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClearPreview}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">
                        {row.first_name} {row.last_name}
                      </TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.type || 'lead'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.stage || 'new'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {row.tags || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {previewData.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        ...and {previewData.length - 10} more contacts
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {previewData.length} Contacts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">Required Columns</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1">first_name</code> - Contact&apos;s first name</li>
                <li><code className="bg-muted px-1">last_name</code> - Contact&apos;s last name</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Optional Columns</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1">email</code>, <code className="bg-muted px-1">phone</code></li>
                <li><code className="bg-muted px-1">type</code>: lead, client, recruit_prospect, agent</li>
                <li><code className="bg-muted px-1">stage</code>: new, contacted, qualified, proposal, negotiation, closed_won, closed_lost</li>
                <li><code className="bg-muted px-1">source</code>, <code className="bg-muted px-1">company</code>, <code className="bg-muted px-1">job_title</code></li>
                <li><code className="bg-muted px-1">address_line1</code>, <code className="bg-muted px-1">city</code>, <code className="bg-muted px-1">state</code>, <code className="bg-muted px-1">zip_code</code></li>
                <li><code className="bg-muted px-1">notes</code>, <code className="bg-muted px-1">tags</code> (semicolon-separated)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse rows
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim().toLowerCase()] = values[index]?.trim() || '';
    });

    rows.push(row as unknown as ParsedRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  values.push(current);
  return values;
}
