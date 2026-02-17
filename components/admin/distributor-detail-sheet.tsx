// SPEC: SPEC-WORKFLOWS > WF-7: Admin Suspend/Reactivate
// Distributor detail sheet with suspend/reactivate actions

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDistributorDetail,
  suspendDistributor,
  reactivateDistributor,
  deleteDistributor,
  type DistributorDetail,
} from "@/lib/actions/admin";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, UserX, UserCheck, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { ConfirmDialog } from "./confirm-dialog";

type DistributorDetailSheetProps = {
  distributorId: string;
  onClose: () => void;
  adminRole?: "super_admin" | "admin" | "viewer";
};

export function DistributorDetailSheet({
  distributorId,
  onClose,
  adminRole = "viewer",
}: DistributorDetailSheetProps) {
  const router = useRouter();
  const [distributor, setDistributor] = useState<DistributorDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getDistributorDetail(distributorId);
      setDistributor(data);
      setLoading(false);
    }
    fetchData();
  }, [distributorId]);

  async function handleSuspend() {
    setActionLoading(true);
    const result = await suspendDistributor(distributorId);
    setActionLoading(false);

    if (result.success) {
      toast.success("Distributor suspended");
      router.refresh();
      onClose();
    } else {
      toast.error(result.error || "Failed to suspend distributor");
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    const result = await reactivateDistributor(distributorId);
    setActionLoading(false);

    if (result.success) {
      toast.success("Distributor reactivated");
      router.refresh();
      onClose();
    } else {
      toast.error(result.error || "Failed to reactivate distributor");
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    const result = await deleteDistributor(distributorId);
    setActionLoading(false);

    if (result.success) {
      toast.success("Distributor permanently deleted");
      router.refresh();
      onClose();
    } else {
      toast.error(result.error || "Failed to delete distributor");
    }
  }

  return (
    <>
      <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : distributor ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {distributor.firstName} {distributor.lastName}
                </SheetTitle>
                <SheetDescription>@{distributor.username}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status Badge */}
                <div>
                  <Badge
                    className={
                      distributor.status === "active"
                        ? "bg-green-100 text-green-700"
                        : distributor.status === "suspended"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {distributor.status}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{distributor.email}</p>
                    </div>
                    {distributor.phone && (
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{distributor.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Enrollment Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Enrollment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Enrolled By</p>
                      <p className="font-medium">
                        {distributor.enrollerName || "Direct"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined Date</p>
                      <p className="font-medium">
                        {formatDate(distributor.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Organization Stats */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Organization</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Downline</p>
                      <p className="text-2xl font-bold">{distributor.totalOrg}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Direct Enrollees</p>
                      <p className="text-2xl font-bold">
                        {distributor.directEnrollees}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  {distributor.status === "active" ? (
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => setShowSuspendDialog(true)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      Suspend Distributor
                    </Button>
                  ) : distributor.status === "suspended" ? (
                    <Button
                      variant="default"
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => setShowReactivateDialog(true)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      Reactivate Distributor
                    </Button>
                  ) : null}

                  {/* Delete Button - Super Admin Only */}
                  {adminRole === "super_admin" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Permanently
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Distributor not found</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        title="Suspend Distributor"
        description={`Are you sure you want to suspend ${distributor?.firstName} ${distributor?.lastName}? Their replicated site will be deactivated.`}
        confirmText="Suspend"
        onConfirm={handleSuspend}
        variant="destructive"
      />

      <ConfirmDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        title="Reactivate Distributor"
        description={`Are you sure you want to reactivate ${distributor?.firstName} ${distributor?.lastName}? Their replicated site will be activated.`}
        confirmText="Reactivate"
        onConfirm={handleReactivate}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Distributor Permanently"
        description={`⚠️ WARNING: This will PERMANENTLY delete ${distributor?.firstName} ${distributor?.lastName} and ALL associated data including contacts, enrollments, and matrix position. This action CANNOT be undone.`}
        confirmText="Delete Forever"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
