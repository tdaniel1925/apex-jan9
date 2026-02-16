// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Genealogy Tree
// List view with table and filters

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getOrgList, type OrgMember } from "@/lib/actions/dashboard";
import { TableSkeleton } from "@/components/dashboard";

type ListViewProps = {
  onMemberClick: (member: OrgMember) => void;
};

export function ListViewComponent({ onMemberClick }: ListViewProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [directOnly, setDirectOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "date" | "email">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const pageSize = 25;

  useEffect(() => {
    loadMembers();
  }, [page, searchTerm, directOnly, sortBy, sortOrder]);

  const loadMembers = async () => {
    setIsLoading(true);
    const result = await getOrgList({
      directOnly,
      searchTerm,
      sortBy,
      sortOrder,
      page,
      pageSize,
    });
    setMembers(result.members);
    setTotal(result.total);
    setIsLoading(false);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleToggleDirectOnly = () => {
    setDirectOnly(!directOnly);
    setPage(1);
  };

  const handleSort = (column: "name" | "date" | "email") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && page === 1) {
    return <TableSkeleton />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={directOnly ? "default" : "outline"}
            onClick={handleToggleDirectOnly}
          >
            {directOnly ? "Showing Direct Only" : "Show Direct Only"}
          </Button>
        </div>

        {/* Table */}
        {members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium">No Team Members Found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm
                ? "Try adjusting your search"
                : "Share your replicated site link to start building your team!"}
            </p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("name")}
                    >
                      Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("email")}
                    >
                      Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Enrolled By</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("date")}
                    >
                      Date Joined {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onMemberClick(member)}
                    >
                      <TableCell className="font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        {member.isDirect ? (
                          <Badge className="bg-green-500 text-white">Direct</Badge>
                        ) : member.isSpillover ? (
                          <Badge className="bg-orange-500 text-white">Spillover</Badge>
                        ) : (
                          <Badge variant="secondary">Downline</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.enrollerName || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, total)} of {total} members
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          disabled={isLoading}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
