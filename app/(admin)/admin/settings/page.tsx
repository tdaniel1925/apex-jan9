'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Shield,
  Bell,
  CreditCard,
  Users,
  FileText,
  RefreshCw,
  Save,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Company Settings
    companyName: 'Apex Affinity Group',
    supportEmail: 'support@apexaffinity.com',
    supportPhone: '(800) 555-0123',

    // Commission Settings
    commissionProcessingDay: '15',
    autoApproveThreshold: '500',

    // Bonus Settings
    currentPhase: '1',
    autoApproveBonuses: true,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,

    // Security Settings
    requireMfa: false,
    sessionTimeout: '60',

    // AI Copilot Settings
    aiCopilotEnabled: true,
    defaultAiModel: 'claude-sonnet',
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>
            Basic company settings and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings(s => ({ ...s, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings(s => ({ ...s, supportEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                value={settings.supportPhone}
                onChange={(e) => setSettings(s => ({ ...s, supportPhone: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Commission Settings</CardTitle>
          </div>
          <CardDescription>
            Configure commission processing and payout settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commissionDay">Commission Processing Day</Label>
              <Select
                value={settings.commissionProcessingDay}
                onValueChange={(value) => setSettings(s => ({ ...s, commissionProcessingDay: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st of month</SelectItem>
                  <SelectItem value="15">15th of month</SelectItem>
                  <SelectItem value="last">Last day of month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoThreshold">Auto-Approve Threshold</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="autoThreshold"
                  type="number"
                  value={settings.autoApproveThreshold}
                  onChange={(e) => setSettings(s => ({ ...s, autoApproveThreshold: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Payouts under this amount are auto-approved
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Bonus Configuration</CardTitle>
          </div>
          <CardDescription>
            Manage bonus phases and approval settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Current Bonus Phase</Label>
              <div className="flex items-center gap-4">
                <Select
                  value={settings.currentPhase}
                  onValueChange={(value) => setSettings(s => ({ ...s, currentPhase: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Phase 1</SelectItem>
                    <SelectItem value="2">Phase 2</SelectItem>
                    <SelectItem value="3">Phase 3</SelectItem>
                    <SelectItem value="4">Phase 4</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline">
                  0-100 agents
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Phase determines which bonuses are available
              </p>
            </div>
            <div className="space-y-2">
              <Label>Auto-Approve Bonuses</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.autoApproveBonuses}
                  onCheckedChange={(checked: boolean) => setSettings(s => ({ ...s, autoApproveBonuses: checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  {settings.autoApproveBonuses ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically approve qualifying bonuses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure system notifications and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email alerts for important events
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked: boolean) => setSettings(s => ({ ...s, emailNotifications: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send SMS alerts for urgent events
              </p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked: boolean) => setSettings(s => ({ ...s, smsNotifications: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Configure security and access controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require MFA for Admins</Label>
              <p className="text-sm text-muted-foreground">
                Enforce multi-factor authentication for admin users
              </p>
            </div>
            <Switch
              checked={settings.requireMfa}
              onCheckedChange={(checked: boolean) => setSettings(s => ({ ...s, requireMfa: checked }))}
            />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(s => ({ ...s, sessionTimeout: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Copilot Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>AI Copilot</CardTitle>
          </div>
          <CardDescription>
            Configure AI assistant settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Copilot Service</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered assistant for agents
              </p>
            </div>
            <Switch
              checked={settings.aiCopilotEnabled}
              onCheckedChange={(checked: boolean) => setSettings(s => ({ ...s, aiCopilotEnabled: checked }))}
            />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default AI Model</Label>
              <Select
                value={settings.defaultAiModel}
                onValueChange={(value) => setSettings(s => ({ ...s, defaultAiModel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-haiku">Claude Haiku (Fast)</SelectItem>
                  <SelectItem value="claude-sonnet">Claude Sonnet (Balanced)</SelectItem>
                  <SelectItem value="claude-opus">Claude Opus (Advanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reset All Settings</Label>
              <p className="text-sm text-muted-foreground">
                Reset all settings to their default values
              </p>
            </div>
            <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
              Reset Settings
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Clear All Data</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete all system data (irreversible)
              </p>
            </div>
            <Button variant="destructive">
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
