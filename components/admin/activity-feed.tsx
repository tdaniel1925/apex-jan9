// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Dashboard
// Activity feed component

import type { RecentActivity } from "@/lib/actions/admin";
import { formatDistanceToNow } from "@/lib/utils/date";
import { User, Shield, Cog, Globe } from "lucide-react";

type ActivityFeedProps = {
  activities: RecentActivity[];
};

function getActorIcon(actorType: string) {
  switch (actorType) {
    case "distributor":
      return User;
    case "admin":
      return Shield;
    case "system":
      return Cog;
    case "visitor":
      return Globe;
    default:
      return User;
  }
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = getActorIcon(activity.actorType);
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{formatAction(activity.action)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.actorType} • {formatDistanceToNow(activity.createdAt)} ago
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
