// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Dashboard Navigation
// Dashboard navigation component

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Users, Mail, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/team", label: "My Team", icon: Users },
  { href: "/dashboard/contacts", label: "Contacts", icon: Mail },
  { href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
];

type DashboardNavProps = {
  isMobile?: boolean;
};

export function DashboardNav({ isMobile = false }: DashboardNavProps) {
  const pathname = usePathname();

  if (isMobile) {
    return (
      <nav className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
