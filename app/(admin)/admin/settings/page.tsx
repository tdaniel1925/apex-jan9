// SPEC: SPEC-PAGES > Admin Settings (/admin/settings)
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Panel
// System settings management

import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const user = await requireAdmin();
  const settings = await getSystemSettings();

  // Only super_admin can edit settings
  const canEdit = user.role === "super_admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system-wide configuration
        </p>
      </div>

      {/* Settings Form */}
      <SettingsForm initialSettings={settings} canEdit={canEdit} />
    </div>
  );
}
