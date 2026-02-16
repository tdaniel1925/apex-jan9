// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Dashboard
// Stats card component for admin dashboard

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "purple" | "gray";
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
};

const colorClasses = {
  blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  red: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
  purple:
    "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
  gray: "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
  trendLabel,
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        {trendLabel && (
          <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
