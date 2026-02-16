// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Contact Submissions
// Contacts view with filters and message detail

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Mail, ExternalLink } from "lucide-react";
import { getContactSubmissions, markContactAsRead, archiveContact } from "@/lib/actions";
import { StatusBadge } from "@/components/dashboard";
import { TableSkeleton } from "@/components/dashboard";
import { toast } from "sonner";
import type { ContactSubmission } from "@/lib/db/schema";
import { MessageDetail } from "@/components/dashboard/message-detail";

type ContactStatus = "new" | "read" | "replied" | "archived";

export function ContactsView() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | undefined>(
    undefined
  );
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const pageSize = 25;

  useEffect(() => {
    loadContacts();
  }, [page, statusFilter]);

  const loadContacts = async () => {
    setIsLoading(true);
    const result = await getContactSubmissions({
      status: statusFilter,
      page,
      pageSize,
    });
    setContacts(result.submissions);
    setTotal(result.total);
    setIsLoading(false);
  };

  const handleContactClick = async (contact: ContactSubmission) => {
    setSelectedContact(contact);
    setIsDetailOpen(true);

    // Mark as read if new
    if (contact.status === "new") {
      const result = await markContactAsRead(contact.id);
      if (result.success) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id ? { ...c, status: "read", readAt: new Date() } : c
          )
        );
      }
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedContact(null), 300);
  };

  const handleArchive = async (contactId: string) => {
    const result = await archiveContact(contactId);
    if (result.success) {
      toast.success("Message archived");
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, status: "archived" } : c))
      );
      if (selectedContact?.id === contactId) {
        handleCloseDetail();
      }
    } else {
      toast.error("Failed to archive message");
    }
  };

  const handleStatusFilter = (status: ContactStatus | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && page === 1) {
    return <TableSkeleton />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter(undefined)}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("new")}
            >
              New
            </Button>
            <Button
              variant={statusFilter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("read")}
            >
              Read
            </Button>
            <Button
              variant={statusFilter === "replied" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("replied")}
            >
              Replied
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("archived")}
            >
              Archived
            </Button>
          </div>

          {/* Table */}
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Messages Yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                When visitors contact you through your replicated page, their messages
                will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Message Preview</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          contact.status === "new"
                            ? "border-l-4 border-l-blue-500 bg-blue-50/50 font-medium"
                            : ""
                        }`}
                        onClick={() => handleContactClick(contact)}
                      >
                        <TableCell>{contact.visitorName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.visitorEmail}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {contact.message.slice(0, 50)}
                          {contact.message.length > 50 ? "..." : ""}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={contact.status} type="contact" />
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
                    {Math.min(page * pageSize, total)} of {total} messages
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

      {selectedContact && (
        <MessageDetail
          contact={selectedContact}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          onArchive={handleArchive}
        />
      )}
    </>
  );
}
