// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Panel Navigation
// Admin navigation component

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, GitBranch, Mail, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/distributors", label: "Distributors", icon: Users },
  { href: "/admin/org-tree", label: "Org Tree", icon: GitBranch },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

type AdminNavProps = {
  isMobile?: boolean;
};

export function AdminNav({ isMobile = false }: AdminNavProps) {
  const pathname = usePathname();

  if (isMobile) {
    return (
      <nav className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                isActive
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400"
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
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-purple-600 text-white"
                : "text-muted-foreground hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300"
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
