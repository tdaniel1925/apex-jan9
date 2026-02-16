// SPEC: SPEC-PAGES > Team Page
// SPEC: SPEC-WORKFLOWS > WF-6
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Genealogy Tree
// Team page with tree and list views

import { requireDistributor } from "@/lib/auth";
import { TeamView } from "@/components/dashboard/team-view";
import { Suspense } from "react";
import { TreeSkeleton } from "@/components/dashboard";

export default async function TeamPage() {
  const user = await requireDistributor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Team</h1>
        <p className="text-muted-foreground mt-1">
          View your organization as a tree or list
        </p>
      </div>

      <Suspense fallback={<TreeSkeleton />}>
        <TeamView userId={user.id} />
      </Suspense>
    </div>
  );
}
