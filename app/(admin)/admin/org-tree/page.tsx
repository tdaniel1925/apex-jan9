// SPEC: SPEC-PAGES > Org Tree (/admin/org-tree)
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Panel
// Full organization tree from root

import { requireAdmin } from "@/lib/auth";
import { AdminOrgTree } from "@/components/admin/admin-org-tree";

export default async function OrgTreePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Tree</h1>
        <p className="text-muted-foreground mt-1">
          View the complete organization hierarchy
        </p>
      </div>

      {/* Tree Component */}
      <AdminOrgTree />
    </div>
  );
}
