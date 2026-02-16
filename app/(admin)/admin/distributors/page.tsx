// SPEC: SPEC-PAGES > Distributors List (/admin/distributors)
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Panel
// Admin distributors list page with search, filter, and actions

import { requireAdmin } from "@/lib/auth";
import { getAllDistributors } from "@/lib/actions";
import { DistributorsTable } from "@/components/admin/distributors-table";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
};

export default async function DistributorsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const status = (params.status || "all") as
    | "active"
    | "inactive"
    | "suspended"
    | "all";

  const { items, totalCount, totalPages } = await getAllDistributors({
    page,
    limit: 50,
    search,
    status,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Distributors</h1>
        <p className="text-muted-foreground mt-1">
          Manage all distributors in the system
        </p>
      </div>

      {/* Distributors Table */}
      <DistributorsTable
        initialData={items}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
