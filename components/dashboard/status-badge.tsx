// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Dashboard Components
// Status badge for contacts and distributors

import { Badge } from "@/components/ui/badge";

type ContactStatus = "new" | "read" | "replied" | "archived";
type DistributorStatus = "active" | "inactive" | "suspended";

type StatusBadgeProps =
  | {
      status: ContactStatus;
      type: "contact";
    }
  | {
      status: DistributorStatus;
      type: "distributor";
    };

export function StatusBadge({ status, type }: StatusBadgeProps) {
  if (type === "contact") {
    const contactVariants: Record<
      ContactStatus,
      { label: string; className: string }
    > = {
      new: { label: "New", className: "bg-blue-500 text-white hover:bg-blue-600" },
      read: { label: "Read", className: "bg-gray-500 text-white hover:bg-gray-600" },
      replied: {
        label: "Replied",
        className: "bg-green-500 text-white hover:bg-green-600",
      },
      archived: {
        label: "Archived",
        className: "bg-gray-400 text-white hover:bg-gray-500",
      },
    };

    const config = contactVariants[status];
    return (
      <Badge variant="default" className={config.className}>
        {config.label}
      </Badge>
    );
  } else {
    const distributorVariants: Record<
      DistributorStatus,
      { label: string; className: string }
    > = {
      active: {
        label: "Active",
        className: "bg-green-500 text-white hover:bg-green-600",
      },
      inactive: {
        label: "Inactive",
        className: "bg-gray-500 text-white hover:bg-gray-600",
      },
      suspended: {
        label: "Suspended",
        className: "bg-red-500 text-white hover:bg-red-600",
      },
    };

    const config = distributorVariants[status];
    return (
      <Badge variant="default" className={config.className}>
        {config.label}
      </Badge>
    );
  }
}
