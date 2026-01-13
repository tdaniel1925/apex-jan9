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
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface AdminMobileSidebarProps {
  agent: Agent;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Agents', href: '/admin/agents', icon: Users },
  { name: 'Import Commissions', href: '/admin/commissions', icon: FileSpreadsheet },
  { name: 'Bonuses', href: '/admin/bonuses', icon: Award },
  { name: 'Payouts', href: '/admin/payouts', icon: Wallet },
  { name: 'Override Report', href: '/admin/overrides', icon: DollarSign },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
];

export function AdminMobileSidebar({ agent }: AdminMobileSidebarProps) {
  const pathname = usePathname();
  const rankConfig = RANK_CONFIG[agent.rank];

  return (
    <div className="flex h-full flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4">
      {/* Logo with Admin Badge */}
      <div className="flex h-16 shrink-0 items-center justify-between pt-4">
        <Logo href="/admin" size="sm" variant="white" />
        <Shield className="h-5 w-5 text-sidebar-primary" />
      </div>

      {/* Agent Info */}
      <div className="rounded-lg bg-sidebar-accent p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
            {agent.first_name[0]}{agent.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {agent.first_name} {agent.last_name}
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              {rankConfig.name}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
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
  );
}
