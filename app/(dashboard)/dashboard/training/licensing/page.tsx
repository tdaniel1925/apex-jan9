'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Award
} from 'lucide-react';
import type { AgentLicense } from '@/lib/types/training';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

const LICENSE_TYPES = [
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'life_and_health', label: 'Life & Health' },
  { value: 'variable', label: 'Variable Products' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-gray-100 text-gray-800',
};

export default function LicensingPage() {
  const [licenses, setLicenses] = useState<AgentLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [stateCode, setStateCode] = useState('');
  const [licenseType, setLicenseType] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [ceCreditsRequired, setCeCreditsRequired] = useState('');
  const [ceCreditsCompleted, setCeCreditsCompleted] = useState('');

  useEffect(() => {
    fetchLicenses();
  }, []);

  async function fetchLicenses() {
    try {
      const res = await fetch('/api/training/licenses');
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddLicense = async () => {
    if (!stateCode || !licenseType) return;

    setSaving(true);
    try {
      const payload = {
        state_code: stateCode,
        license_type: licenseType,
        license_number: licenseNumber || undefined,
        issued_date: issuedDate || undefined,
        expiration_date: expirationDate || undefined,
        ce_credits_required: ceCreditsRequired ? Number(ceCreditsRequired) : undefined,
        ce_credits_completed: ceCreditsCompleted ? Number(ceCreditsCompleted) : undefined,
        status: 'active',
      };

      const res = await fetch('/api/training/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchLicenses();
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding license:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStateCode('');
    setLicenseType('');
    setLicenseNumber('');
    setIssuedDate('');
    setExpirationDate('');
    setCeCreditsRequired('');
    setCeCreditsCompleted('');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const expirationDate = new Date(dateString);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 60 && daysUntilExpiration > 0;
  };

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const getStateName = (code: string) => {
    return US_STATES.find(s => s.code === code)?.name || code;
  };

  const getLicenseTypeName = (type: string) => {
    return LICENSE_TYPES.find(t => t.value === type)?.label || type;
  };

  // Calculate summary stats
  const activeLicenses = licenses.filter(l => l.status === 'active' && !isExpired(l.expiration_date));
  const expiringSoon = licenses.filter(l => isExpiringSoon(l.expiration_date));
  const expiredLicenses = licenses.filter(l => isExpired(l.expiration_date));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/training">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Licensing Tracker</h1>
            <p className="text-muted-foreground">
              Track your insurance licenses and CE credits
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add License
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add License</DialogTitle>
              <DialogDescription>
                Enter your license information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select value={stateCode} onValueChange={setStateCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>License Type *</Label>
                  <Select value={licenseType} onValueChange={setLicenseType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g., 1234567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CE Credits Required</Label>
                  <Input
                    type="number"
                    min="0"
                    value={ceCreditsRequired}
                    onChange={(e) => setCeCreditsRequired(e.target.value)}
                    placeholder="e.g., 24"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CE Credits Completed</Label>
                  <Input
                    type="number"
                    min="0"
                    value={ceCreditsCompleted}
                    onChange={(e) => setCeCreditsCompleted(e.target.value)}
                    placeholder="e.g., 12"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLicense} disabled={saving || !stateCode || !licenseType}>
                  {saving ? 'Saving...' : 'Add License'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{activeLicenses.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active Licenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{expiringSoon.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{expiredLicenses.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{licenses.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total States</p>
          </CardContent>
        </Card>
      </div>

      {/* Licenses List */}
      {licenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Licenses Added</h3>
            <p className="text-muted-foreground mb-4">
              Add your insurance licenses to track them in one place.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First License
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {licenses.map(license => {
            const expired = isExpired(license.expiration_date);
            const expiring = isExpiringSoon(license.expiration_date);
            const ceProgress = license.ce_credits_required
              ? Math.min(100, ((license.ce_credits_completed || 0) / license.ce_credits_required) * 100)
              : 0;

            return (
              <Card
                key={license.id}
                className={`${
                  expired
                    ? 'border-red-200 bg-red-50'
                    : expiring
                      ? 'border-yellow-200 bg-yellow-50'
                      : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="font-mono text-xl">{license.state_code}</span>
                        <span className="text-base font-normal text-muted-foreground">
                          {getStateName(license.state_code)}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {getLicenseTypeName(license.license_type)}
                      </CardDescription>
                    </div>
                    <Badge className={STATUS_COLORS[expired ? 'expired' : license.status] || 'bg-gray-100'}>
                      {expired ? 'Expired' : expiring ? 'Expiring Soon' : license.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* License Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {license.license_number && (
                      <div>
                        <p className="text-muted-foreground">License #</p>
                        <p className="font-medium">{license.license_number}</p>
                      </div>
                    )}
                    {license.issued_date && (
                      <div>
                        <p className="text-muted-foreground">Issued</p>
                        <p className="font-medium">{formatDate(license.issued_date)}</p>
                      </div>
                    )}
                    {license.expiration_date && (
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className={`font-medium ${expired ? 'text-red-600' : expiring ? 'text-yellow-600' : ''}`}>
                          {formatDate(license.expiration_date)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CE Credits Progress */}
                  {license.ce_credits_required && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CE Credits</span>
                        <span className="font-medium">
                          {license.ce_credits_completed || 0} / {license.ce_credits_required}
                        </span>
                      </div>
                      <Progress value={ceProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Renewal reminders:</strong> We&apos;ll notify you 60 days before your license expires.
          </p>
          <p>
            <strong>CE tracking:</strong> Complete courses in the Training Center to automatically track credits.
          </p>
          <Link href="/dashboard/training/courses" className="block">
            <Button variant="link" className="p-0 h-auto">
              Browse CE Courses <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
