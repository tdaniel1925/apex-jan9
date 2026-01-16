'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, AlertTriangle, Info, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface CompensationPlan {
  id: string | null;
  name: string;
  description: string | null;
  unlicensed_override_handling: 'roll_up_to_next_licensed' | 'company_retains';
  max_generation_levels: number;
  max_rollup_generations: number;
  chargeback_period_months: number;
  minimum_payout_threshold: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  is_active: boolean;
}

export default function CompensationPlanPage() {
  const [plan, setPlan] = useState<CompensationPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const response = await fetch('/api/admin/compensation-plan');
      if (!response.ok) throw new Error('Failed to fetch plan');
      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load compensation plan settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/compensation-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          unlicensed_override_handling: plan.unlicensed_override_handling,
          max_generation_levels: plan.max_generation_levels,
          max_rollup_generations: plan.max_rollup_generations,
          chargeback_period_months: plan.chargeback_period_months,
          minimum_payout_threshold: plan.minimum_payout_threshold,
          payment_frequency: plan.payment_frequency,
        }),
      });

      if (!response.ok) throw new Error('Failed to save plan');

      const updatedPlan = await response.json();
      setPlan(updatedPlan);
      setHasChanges(false);
      toast.success('Compensation plan settings saved');
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save compensation plan settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePlan = (updates: Partial<CompensationPlan>) => {
    if (!plan) return;
    setPlan({ ...plan, ...updates });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load compensation plan settings.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compensation Plan Settings</h1>
          <p className="text-muted-foreground">
            Configure how commissions are calculated and paid
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Regulatory Warning */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Regulatory Compliance</AlertTitle>
        <AlertDescription>
          This plan is configured to comply with NAIC Model Law §218, Texas Insurance Code §4005.053,
          and NY Insurance Law §2114-2116. Commissions cannot be paid to unlicensed persons under any circumstances.
        </AlertDescription>
      </Alert>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Information</CardTitle>
          <CardDescription>Basic details about this compensation plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={plan.name}
                onChange={(e) => updatePlan({ name: e.target.value })}
                placeholder="e.g., Apex Standard Plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={plan.is_active ? 'Active' : 'Inactive'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={plan.description || ''}
              onChange={(e) => updatePlan({ description: e.target.value || null })}
              placeholder="Describe this compensation plan..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* CRITICAL: Unlicensed Override Handling */}
      <Card className="border-amber-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Unlicensed Override Handling
          </CardTitle>
          <CardDescription>
            How to handle override commissions when an upline agent is unlicensed.
            This is a critical compliance setting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={plan.unlicensed_override_handling}
            onValueChange={(value) =>
              updatePlan({
                unlicensed_override_handling: value as 'roll_up_to_next_licensed' | 'company_retains',
              })
            }
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="roll_up_to_next_licensed" id="roll_up" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="roll_up" className="cursor-pointer font-medium">
                  Roll Up to Next Licensed Upline
                </Label>
                <p className="text-sm text-muted-foreground">
                  Override commission passes to the next licensed agent in the hierarchy.
                  The unlicensed agent&apos;s position is preserved but they receive no payment.
                </p>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2 font-mono">
                  Example: A → B (unlicensed) → C (licensed)
                  <br />
                  B&apos;s 10% override ($100) → rolls up to C
                  <br />
                  C receives: 5% own + 10% rolled up = $150
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="company_retains" id="retain" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="retain" className="cursor-pointer font-medium">
                  Company Retains
                </Label>
                <p className="text-sm text-muted-foreground">
                  Override commission is retained by the company. The unlicensed agent&apos;s
                  override is forfeited and does NOT pass to upline.
                </p>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2 font-mono">
                  Example: A → B (unlicensed) → C (licensed)
                  <br />
                  B&apos;s 10% override ($100) → forfeited
                  <br />
                  C receives: only 5% own = $50
                </div>
              </div>
            </div>
          </RadioGroup>

          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Legal Notice</AlertTitle>
            <AlertDescription>
              Commissions CANNOT be held in reserve or escrow for unlicensed persons.
              This constitutes a promise to pay an unlicensed person, which violates state law.
              When an agent becomes licensed, they earn on NEW business only.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Override Generations */}
      <Card>
        <CardHeader>
          <CardTitle>Override Generations</CardTitle>
          <CardDescription>Configure how many generations deep overrides are paid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_generations">Direct Override Generations</Label>
              <Select
                value={String(plan.max_generation_levels)}
                onValueChange={(value) => updatePlan({ max_generation_levels: parseInt(value, 10) })}
              >
                <SelectTrigger id="max_generations">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} generation{n > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Maximum generations for direct override payments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_rollup">Roll-Up Search Depth</Label>
              <Select
                value={String(plan.max_rollup_generations)}
                onValueChange={(value) => updatePlan({ max_rollup_generations: parseInt(value, 10) })}
              >
                <SelectTrigger id="max_rollup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} generation{n > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How far up to search for next licensed upline when rolling up
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Configure payment frequency and thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="frequency">Payment Frequency</Label>
              <Select
                value={plan.payment_frequency}
                onValueChange={(value) =>
                  updatePlan({ payment_frequency: value as 'weekly' | 'biweekly' | 'monthly' })
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_payout">Minimum Payout Threshold</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="min_payout"
                  type="number"
                  min="0"
                  step="1"
                  value={plan.minimum_payout_threshold}
                  onChange={(e) => updatePlan({ minimum_payout_threshold: parseFloat(e.target.value) || 0 })}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum balance required for payout
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chargeback">Chargeback Period</Label>
              <Select
                value={String(plan.chargeback_period_months)}
                onValueChange={(value) => updatePlan({ chargeback_period_months: parseInt(value, 10) })}
              >
                <SelectTrigger id="chargeback">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="9">9 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Period for commission chargebacks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Audit Trail</AlertTitle>
        <AlertDescription>
          All commission calculations and compliance events are logged in an immutable audit trail.
          View the <a href="/admin/compliance-reports" className="underline font-medium">Compliance Reports</a> page
          to see all compliance events and export for regulatory examination.
        </AlertDescription>
      </Alert>
    </div>
  );
}
