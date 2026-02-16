// SPEC: SPEC-PAGES > Contacts Page
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Contact Submissions
// Contacts page with message list and detail view

import { requireDistributor } from "@/lib/auth";
import { ContactsView } from "@/components/dashboard/contacts-view";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/dashboard";

export default async function ContactsPage() {
  const user = await requireDistributor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground mt-1">
          View and manage messages from your replicated site visitors
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ContactsView />
      </Suspense>
    </div>
  );
}
