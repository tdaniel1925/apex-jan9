'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/engines/wallet-engine';

interface TaxDocument {
  type: string;
  year: number;
  generatedAt: string;
  agent: {
    name: string;
    email: string;
    agentCode: string;
  };
  summary: {
    totalCommissions: number;
    totalOverrides: number;
    totalBonuses: number;
    totalEarnings: number;
    transactionCount: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    commissions: number;
    overrides: number;
    bonuses: number;
    total: number;
  }>;
  bonusByType: Record<string, number>;
  disclaimer: string;
}

export default function TaxDocumentsPage() {
  const t = useTranslations('reports.taxDocumentsPage');
  const tReports = useTranslations('reports');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<TaxDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Available years (current year and previous 3 years)
  const availableYears = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ];

  const fetchDocument = async (year: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/tax-documents?year=${year}&type=income_statement`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load tax document');
      }
    } catch (err) {
      console.error('Failed to fetch tax document:', err);
      setError('Failed to load tax document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument(selectedYear);
  }, [selectedYear]);

  const handleDownload = async (type: 'income_statement' | '1099_summary', format: 'csv') => {
    try {
      const response = await fetch(`/api/reports/tax-documents?year=${selectedYear}&type=${type}&format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${type}-${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const is1099Threshold = document && document.summary.totalEarnings >= 600;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => fetchDocument(selectedYear)}>
              {t('tryAgain')}
            </Button>
          </CardContent>
        </Card>
      ) : document ? (
        <>
          {/* 1099 Status Alert */}
          <Card className={is1099Threshold ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {is1099Threshold ? (
                  <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                ) : (
                  <Info className="h-6 w-6 text-yellow-600 shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {is1099Threshold
                      ? t('form1099Required')
                      : t('below1099Threshold')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {is1099Threshold
                      ? t('form1099Message', { amount: formatCurrency(document.summary.totalEarnings) })
                      : t('belowThresholdMessage', { amount: formatCurrency(document.summary.totalEarnings) })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tReports('directCommissions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(document.summary.totalCommissions)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tReports('overrideCommissions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(document.summary.totalOverrides)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tReports('bonuses')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(document.summary.totalBonuses)}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tReports('totalEarnings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatCurrency(document.summary.totalEarnings)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Download Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('downloadDocuments')}</CardTitle>
              <CardDescription>
                {t('downloadDocumentsDesc', { year: selectedYear })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{t('incomeStatement')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('incomeStatementDesc')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownload('income_statement', 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('downloadCsv')}
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{t('form1099Summary')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('form1099SummaryDesc')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownload('1099_summary', 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('downloadCsv')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monthlyBreakdown')}</CardTitle>
              <CardDescription>
                {t('monthlyBreakdownDesc', { year: selectedYear })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('month')}</TableHead>
                    <TableHead className="text-right">{t('commissions')}</TableHead>
                    <TableHead className="text-right">{t('overrides')}</TableHead>
                    <TableHead className="text-right">{tReports('bonuses')}</TableHead>
                    <TableHead className="text-right">{tReports('total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {document.monthlyBreakdown.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.monthName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.commissions)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.overrides)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.bonuses)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(month.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>{tReports('total')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(document.summary.totalCommissions)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(document.summary.totalOverrides)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(document.summary.totalBonuses)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(document.summary.totalEarnings)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bonus Breakdown */}
          {Object.keys(document.bonusByType).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('bonusBreakdown')}</CardTitle>
                <CardDescription>
                  {t('bonusBreakdownDesc', { year: selectedYear })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(document.bonusByType).map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="border-muted">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>{t('disclaimer')}:</strong> {document.disclaimer}
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
