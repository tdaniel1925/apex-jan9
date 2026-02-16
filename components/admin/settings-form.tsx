// SPEC: SPEC-PAGES > Admin Settings
// Settings form component

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSystemSetting } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

type SettingsFormProps = {
  initialSettings: Record<string, string>;
  canEdit: boolean;
};

export function SettingsForm({ initialSettings, canEdit }: SettingsFormProps) {
  const router = useRouter();
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialSettings["maintenance_mode"] === "true"
  );
  const [saving, setSaving] = useState(false);

  async function handleMaintenanceModeToggle(checked: boolean) {
    if (!canEdit) {
      toast.error("Only super admins can modify settings");
      return;
    }

    setSaving(true);
    const result = await updateSystemSetting(
      "maintenance_mode",
      checked.toString()
    );
    setSaving(false);

    if (result.success) {
      setMaintenanceMode(checked);
      toast.success(
        checked ? "Maintenance mode enabled" : "Maintenance mode disabled"
      );
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update setting");
    }
  }

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              View Only Access
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              You need super admin privileges to modify system settings.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Enable maintenance mode to temporarily disable public access to the
            platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, only admins can access the platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceModeToggle}
                disabled={!canEdit || saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Settings Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Drip Email Campaign</CardTitle>
          <CardDescription>
            Manage automated email campaigns for new distributors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Campaign Status</Label>
              <p className="text-sm text-muted-foreground">
                Coming soon in a future update
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Platform configuration and status</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Environment</dt>
              <dd className="font-medium">
                {process.env.NODE_ENV === "production"
                  ? "Production"
                  : "Development"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Database</dt>
              <dd className="font-medium">PostgreSQL (Supabase)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Matrix Levels</dt>
              <dd className="font-medium">7 levels, 5-wide</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
