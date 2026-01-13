'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Agent } from '@/lib/types/database';
import { RANK_CONFIG } from '@/lib/config/ranks';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FileSpreadsheet,
  Award,
  Wallet,
  Settings,
  BarChart3,
  Shield,
  ArrowLeft,
  ShoppingBag,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Database,
  GraduationCap,
  Bot,
  UserCog,
  ClipboardList,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: Array<{
    id: string;
    name: string;
    display_name: string;
    level: 'super_admin' | 'department_head' | 'staff';
  }>;
  permissions: string[];
}

interface AdminSidebarProps {
  agent: Agent;
  adminUser?: AdminUser | null;
}

// Navigation items with required permissions
const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard.view' },
  { name: 'Agents', href: '/admin/agents', icon: Users, permission: 'agents.view' },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag, permission: 'products.view' },
  { name: 'Import Commissions', href: '/admin/commissions', icon: FileSpreadsheet, permission: 'commissions.view' },
  { name: 'Pay Periods', href: '/admin/pay-periods', icon: Calendar, permission: 'payperiods.view' },
  { name: 'Clawbacks', href: '/admin/clawbacks', icon: RotateCcw, permission: 'clawbacks.view' },
  { name: 'Compliance', href: '/admin/compliance', icon: AlertTriangle, permission: 'compliance.view' },
  { name: 'Bonuses', href: '/admin/bonuses', icon: Award, permission: 'bonuses.view' },
  { name: 'Payouts', href: '/admin/payouts', icon: Wallet, permission: 'payouts.view' },
  { name: 'Override Report', href: '/admin/overrides', icon: DollarSign, permission: 'overrides.view' },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics.view' },
  { name: 'Training', href: '/admin/training', icon: GraduationCap, permission: 'training.view' },
  { name: 'SmartOffice', href: '/admin/smartoffice', icon: Database, permission: 'smartoffice.view' },
  { name: 'AI Copilot', href: '/admin/copilot', icon: Bot, permission: 'copilot.view' },
  { name: 'System Settings', href: '/admin/settings', icon: Settings, permission: 'settings.view' },
  { name: 'User Management', href: '/admin/users', icon: UserCog, permission: 'users.view' },
  { name: 'Audit Log', href: '/admin/audit', icon: ClipboardList, permission: 'audit.view' },
];

export function AdminSidebar({ agent, adminUser }: AdminSidebarProps) {
  const pathname = usePathname();
  const rankConfig = RANK_CONFIG[agent.rank];

  // Check if user has permission (for RBAC users)
  const hasPermission = (permission: string): boolean => {
    // Agent-based auth (no RBAC) - show all navigation
    if (!adminUser) return true;

    // Super admin has all permissions
    if (adminUser.roles.some((r) => r.level === 'super_admin')) return true;

    // Check specific permission
    return adminUser.permissions.includes(permission);
  };

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter((item) => hasPermission(item.permission));

  // Get display name and role
  const displayName = adminUser
    ? `${adminUser.first_name} ${adminUser.last_name}`
    : `${agent.first_name} ${agent.last_name}`;

  const displayRole = adminUser
    ? adminUser.roles[0]?.display_name || 'Staff'
    : rankConfig.name;

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4">
        {/* Logo with Admin Badge */}
        <div className="flex h-16 shrink-0 items-center justify-between">
          <Logo href="/admin" size="sm" variant="white" />
          <Shield className="h-5 w-5 text-sidebar-primary" />
        </div>

        {/* User Info */}
        <div className="rounded-lg bg-sidebar-accent p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
              {agent.first_name[0]}{agent.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                {displayRole}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex gap-x-3 rounded-md p-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to Dashboard */}
        <div className="border-t border-sidebar-border pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agent Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
