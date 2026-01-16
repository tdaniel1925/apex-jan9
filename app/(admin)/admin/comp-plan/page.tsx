'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Car,
  Rocket,
  Trophy,
  Save,
  RefreshCw,
  AlertCircle,
  Info,
  DollarSign,
  Clock,
  Target,
  Users,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CAR_BONUS_TIERS,
  CAR_BONUS_CONFIG,
  FAST_START_MILESTONES,
  FAST_START_CONFIG,
  ELITE_10_CONFIG,
  ELITE_10_SCORE_WEIGHTS,
  QUALITY_GATES,
} from '@/lib/config/incentives';
import { formatCurrency } from '@/lib/engines/wallet-engine';

interface ProgramSetting {
  id: string;
  program_key: string;
  program_name: string;
  is_enabled: boolean;
  settings: Record<string, unknown>;
  updated_at: string;
}

export default function CompPlanSettingsPage() {
  const [programs, setPrograms] = useState<ProgramSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/comp-plan/settings');

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();
      setPrograms(data.programs || []);
    } catch (err) {
      console.error('Error fetching comp plan settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      // Set default state if API fails
      setPrograms([
        { id: '1', program_key: 'car_bonus', program_name: 'APEX Drive (Car Bonus)', is_enabled: true, settings: {}, updated_at: new Date().toISOString() },
        { id: '2', program_key: 'fast_start', program_name: 'APEX Ignition (Fast Start)', is_enabled: true, settings: {}, updated_at: new Date().toISOString() },
        { id: '3', program_key: 'elite_10', program_name: 'Elite 10 Recognition', is_enabled: true, settings: {}, updated_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const toggleProgram = (programKey: string, enabled: boolean) => {
    // Fast Start cannot be disabled
    if (programKey === 'fast_start') {
      toast.error('Fast Start program cannot be disabled');
      return;
    }

    setPrograms(prev => prev.map(p =>
      p.program_key === programKey ? { ...p, is_enabled: enabled } : p
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/comp-plan/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programs }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Comp plan settings saved successfully');
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getProgramIcon = (key: string) => {
    switch (key) {
      case 'car_bonus': return Car;
      case 'fast_start': return Rocket;
      case 'elite_10': return Trophy;
      default: return Award;
    }
  };

  const getProgramStatus = (key: string) => {
    const program = programs.find(p => p.program_key === key);
    return program?.is_enabled ?? false;
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comp Plan Settings</h1>
          <p className="text-muted-foreground">
            Configure incentive programs and bonus settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPrograms}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Quality Gates */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quality Gates (All Programs):</strong> Min {QUALITY_GATES.minPlacementRatio}% placement ratio, Min {QUALITY_GATES.minPersistencyRatio}% persistency ratio, No chargebacks
        </AlertDescription>
      </Alert>

      {/* Program Cards */}
      <div className="grid gap-6">
        {/* APEX Drive (Car Bonus) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    APEX Drive (Car Bonus)
                    <Badge variant={getProgramStatus('car_bonus') ? 'default' : 'secondary'}>
                      {getProgramStatus('car_bonus') ? 'Active' : 'Disabled'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Monthly car allowance based on premium production
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={getProgramStatus('car_bonus')}
                onCheckedChange={(checked) => toggleProgram('car_bonus', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>3 consecutive months to qualify</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Paid on 15th of following month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Miss 2 months = drop tier</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3">Tier Structure</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Monthly Premium</TableHead>
                    <TableHead>Monthly Bonus</TableHead>
                    <TableHead>Annual Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CAR_BONUS_TIERS.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{tier.tierName}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(tier.minMonthlyPremium)}
                        {tier.maxMonthlyPremium ? ` - ${formatCurrency(tier.maxMonthlyPremium)}` : '+'}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(tier.monthlyBonusAmount)}
                      </TableCell>
                      <TableCell>{formatCurrency(tier.annualValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* APEX Ignition (Fast Start) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <Rocket className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    APEX Ignition (Fast Start)
                    <Badge variant="default">Always Active</Badge>
                  </CardTitle>
                  <CardDescription>
                    Milestone bonuses for new agents in their first 90 days
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={true}
                disabled
                title="Fast Start program cannot be disabled"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{FAST_START_CONFIG.windowDays} day window</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Up to {formatCurrency(FAST_START_CONFIG.maxTotalBonus)} total</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{FAST_START_CONFIG.recruiterMatchPercentage}% recruiter match</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Paid within {FAST_START_CONFIG.payoutWithinDays} days</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3">Milestones</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Timeframe</TableHead>
                    <TableHead>Bonus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FAST_START_MILESTONES.map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell className="font-medium">{milestone.milestoneName}</TableCell>
                      <TableCell>
                        {milestone.milestoneType === 'first_policy'
                          ? 'Place first policy'
                          : `${formatCurrency(milestone.premiumThreshold!)} premium`}
                      </TableCell>
                      <TableCell>Days 1-{milestone.daysLimit}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(milestone.bonusAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Elite 10 Recognition */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Elite 10 Recognition
                    <Badge variant={getProgramStatus('elite_10') ? 'default' : 'secondary'}>
                      {getProgramStatus('elite_10') ? 'Active' : 'Disabled'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Quarterly top performer recognition and assist program
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={getProgramStatus('elite_10')}
                onCheckedChange={(checked) => toggleProgram('elite_10', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatCurrency(ELITE_10_CONFIG.quarterlyBonus)} quarterly bonus</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>${ELITE_10_CONFIG.assistOverridePercentage}% assist override</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>{ELITE_10_CONFIG.hallOfFameQuartersRequired}+ quarters = Hall of Fame</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Min rank: {ELITE_10_CONFIG.minRank}</span>
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-3">Selection Criteria (Weighted Score)</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ELITE_10_SCORE_WEIGHTS.map((weight) => (
                      <TableRow key={weight.metric}>
                        <TableCell>{weight.description}</TableCell>
                        <TableCell className="font-medium">{weight.weight * 100}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Elite 10 Benefits</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">$</Badge>
                    <span>{formatCurrency(ELITE_10_CONFIG.quarterlyBonus)} quarterly selection bonus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">$</Badge>
                    <span>$50-$100 per assist + {ELITE_10_CONFIG.assistOverridePercentage}% override</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">*</Badge>
                    <span>Featured on company website and marketing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">*</Badge>
                    <span>Direct line to leadership</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">*</Badge>
                    <span>Annual Elite Summit invitation</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SmartOffice Integration Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All incentive bonus payouts are calculated in Apex and submitted to SmartOffice for payment processing.
          Car Bonus is paid on the 15th, Fast Start within 7 days, Elite 10 quarterly within 14 days, and assist bonuses weekly.
        </AlertDescription>
      </Alert>
    </div>
  );
}
