'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Building2, CreditCard, MapPin, Loader2, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'sonner';

interface BankingInfo {
  id?: string;
  bank_name: string | null;
  account_holder_name: string | null;
  account_type: 'checking' | 'savings';
  routing_number: string | null;
  account_number_last4: string | null;
  verification_status: 'pending' | 'verified' | 'failed';
  verified_at: string | null;
  mailing_address_line1: string | null;
  mailing_address_line2: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_zip: string | null;
  mailing_country: string | null;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
];

export default function BankingSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankingInfo, setBankingInfo] = useState<BankingInfo | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder_name: '',
    account_type: 'checking' as 'checking' | 'savings',
    routing_number: '',
    account_number: '',
    mailing_address_line1: '',
    mailing_address_line2: '',
    mailing_city: '',
    mailing_state: '',
    mailing_zip: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    fetchBankingInfo();
  }, [user]);

  const fetchBankingInfo = async () => {
    try {
      const response = await fetch('/api/settings/banking');
      if (response.ok) {
        const data = await response.json();
        if (data.banking_info) {
          setBankingInfo(data.banking_info);
          setFormData({
            bank_name: data.banking_info.bank_name || '',
            account_holder_name: data.banking_info.account_holder_name || '',
            account_type: data.banking_info.account_type || 'checking',
            routing_number: data.banking_info.routing_number || '',
            account_number: '', // Never pre-fill account number
            mailing_address_line1: data.banking_info.mailing_address_line1 || '',
            mailing_address_line2: data.banking_info.mailing_address_line2 || '',
            mailing_city: data.banking_info.mailing_city || '',
            mailing_state: data.banking_info.mailing_state || '',
            mailing_zip: data.banking_info.mailing_zip || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch banking info:', error);
      toast.error('Failed to load banking information');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bank_name) {
      newErrors.bank_name = 'Bank name is required';
    }

    if (!formData.account_holder_name) {
      newErrors.account_holder_name = 'Account holder name is required';
    }

    if (formData.routing_number && !/^\d{9}$/.test(formData.routing_number)) {
      newErrors.routing_number = 'Routing number must be 9 digits';
    }

    if (formData.account_number && (formData.account_number.length < 4 || formData.account_number.length > 17)) {
      newErrors.account_number = 'Account number must be 4-17 digits';
    }

    if (formData.mailing_zip && !/^\d{5}(-\d{4})?$/.test(formData.mailing_zip)) {
      newErrors.mailing_zip = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string | undefined> = {
        bank_name: formData.bank_name || undefined,
        account_holder_name: formData.account_holder_name || undefined,
        account_type: formData.account_type,
        routing_number: formData.routing_number || undefined,
        mailing_address_line1: formData.mailing_address_line1 || undefined,
        mailing_address_line2: formData.mailing_address_line2 || undefined,
        mailing_city: formData.mailing_city || undefined,
        mailing_state: formData.mailing_state || undefined,
        mailing_zip: formData.mailing_zip || undefined,
      };

      // Only include account number if user entered a new one
      if (formData.account_number) {
        payload.account_number = formData.account_number;
      }

      const response = await fetch('/api/settings/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save banking information');
      }

      const data = await response.json();
      setBankingInfo(data.banking_info);
      setFormData(prev => ({ ...prev, account_number: '' })); // Clear account number field
      toast.success(data.message || 'Banking information saved successfully');
    } catch (error) {
      console.error('Failed to save banking info:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save banking information');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive">Verification Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending Verification</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banking Information</h1>
          <p className="text-muted-foreground">
            Add your bank account details to receive withdrawals
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Your information is secure</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Bank account details are encrypted and stored securely. We never share your financial information with third parties.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Account
          </CardTitle>
          <CardDescription>
            Enter your bank account details for ACH transfers and wire payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bankingInfo?.verification_status && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getVerificationBadge(bankingInfo.verification_status)}
              {bankingInfo.verified_at && (
                <span className="text-xs text-muted-foreground">
                  (Verified {new Date(bankingInfo.verified_at).toLocaleDateString()})
                </span>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                placeholder="e.g., Chase Bank, Bank of America"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className={errors.bank_name ? 'border-red-500' : ''}
              />
              {errors.bank_name && (
                <p className="text-xs text-red-500">{errors.bank_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_holder_name">Account Holder Name *</Label>
              <Input
                id="account_holder_name"
                placeholder="Name as it appears on your account"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                className={errors.account_holder_name ? 'border-red-500' : ''}
              />
              {errors.account_holder_name && (
                <p className="text-xs text-red-500">{errors.account_holder_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value: 'checking' | 'savings') =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="routing_number">Routing Number</Label>
              <Input
                id="routing_number"
                placeholder="9-digit routing number"
                value={formData.routing_number}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setFormData({ ...formData, routing_number: value });
                }}
                className={errors.routing_number ? 'border-red-500' : ''}
              />
              {errors.routing_number && (
                <p className="text-xs text-red-500">{errors.routing_number}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account_number">
                Account Number
                {bankingInfo?.account_number_last4 && (
                  <span className="text-muted-foreground ml-2">
                    (Currently ends in {bankingInfo.account_number_last4})
                  </span>
                )}
              </Label>
              <Input
                id="account_number"
                type="password"
                placeholder={bankingInfo?.account_number_last4 ? 'Enter new account number to update' : 'Enter account number'}
                value={formData.account_number}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 17);
                  setFormData({ ...formData, account_number: value });
                }}
                className={errors.account_number ? 'border-red-500' : ''}
              />
              {errors.account_number && (
                <p className="text-xs text-red-500">{errors.account_number}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your full account number is encrypted and never displayed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mailing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mailing Address
          </CardTitle>
          <CardDescription>
            Required for check payments and wire transfer documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="mailing_address_line1">Address Line 1</Label>
              <Input
                id="mailing_address_line1"
                placeholder="Street address"
                value={formData.mailing_address_line1}
                onChange={(e) => setFormData({ ...formData, mailing_address_line1: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailing_address_line2">Address Line 2</Label>
              <Input
                id="mailing_address_line2"
                placeholder="Apt, Suite, Unit, etc. (optional)"
                value={formData.mailing_address_line2}
                onChange={(e) => setFormData({ ...formData, mailing_address_line2: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="mailing_city">City</Label>
                <Input
                  id="mailing_city"
                  placeholder="City"
                  value={formData.mailing_city}
                  onChange={(e) => setFormData({ ...formData, mailing_city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailing_state">State</Label>
                <Select
                  value={formData.mailing_state}
                  onValueChange={(value) => setFormData({ ...formData, mailing_state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailing_zip">ZIP Code</Label>
                <Input
                  id="mailing_zip"
                  placeholder="12345"
                  value={formData.mailing_zip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]/g, '').slice(0, 10);
                    setFormData({ ...formData, mailing_zip: value });
                  }}
                  className={errors.mailing_zip ? 'border-red-500' : ''}
                />
                {errors.mailing_zip && (
                  <p className="text-xs text-red-500">{errors.mailing_zip}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-900 dark:text-yellow-100">Important</p>
            <ul className="text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside space-y-1">
              <li>Ensure your bank account details match exactly as they appear on your bank statement</li>
              <li>Changing your account number will require re-verification</li>
              <li>First-time withdrawals may be held for up to 48 hours for security</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Link href="/dashboard/settings">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Banking Information
        </Button>
      </div>
    </div>
  );
}
