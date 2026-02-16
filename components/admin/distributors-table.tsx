// SPEC: SPEC-PAGES > Distributors List (/admin/distributors)
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Panel
// Distributors table with search, filter, and actions

"use client";

import { useState } from "react";
import type { DistributorListItem } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { DistributorDetailSheet } from "./distributor-detail-sheet";

type DistributorsTableProps = {
  initialData: DistributorListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

export function DistributorsTable({
  initialData,
  totalCount,
  currentPage,
  totalPages,
}: DistributorsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(
    null
  );

  const filteredData = initialData.filter((d) => {
    const matchesSearch =
      search === "" ||
      d.firstName.toLowerCase().includes(search.toLowerCase()) ||
      d.lastName.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.username.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("CSV export feature coming soon")}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enroller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No distributors found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((distributor) => (
                    <tr
                      key={distributor.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedDistributor(distributor.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {distributor.firstName} {distributor.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          @{distributor.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {distributor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {distributor.enrollerName || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(distributor.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(distributor.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredData.length} of {totalCount} distributors
          </p>
          <p>
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>

      {/* Distributor Detail Sheet */}
      {selectedDistributor && (
        <DistributorDetailSheet
          distributorId={selectedDistributor}
          onClose={() => setSelectedDistributor(null)}
        />
      )}
    </>
  );
}
