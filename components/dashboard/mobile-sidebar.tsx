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
  Wallet,
  BookOpen,
  Contact,
  Settings,
  BarChart3,
  Network,
  Award,
  LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useTranslations } from 'next-intl';

interface MobileSidebarProps {
  agent: Agent;
}

interface NavItem {
  nameKey: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { nameKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { nameKey: 'team', href: '/dashboard/team', icon: Users },
  { nameKey: 'genealogy', href: '/dashboard/genealogy', icon: Network },
  { nameKey: 'commissions', href: '/dashboard/commissions', icon: DollarSign },
  { nameKey: 'bonuses', href: '/dashboard/bonuses', icon: Award },
  { nameKey: 'wallet', href: '/dashboard/wallet', icon: Wallet },
  { nameKey: 'crm', href: '/dashboard/crm', icon: Contact },
  { nameKey: 'training', href: '/dashboard/training', icon: BookOpen },
  { nameKey: 'reports', href: '/dashboard/reports', icon: BarChart3 },
  { nameKey: 'settings', href: '/dashboard/settings', icon: Settings },
];

export function MobileSidebar({ agent }: MobileSidebarProps) {
  const pathname = usePathname();
  const rankConfig = RANK_CONFIG[agent.rank];
  const t = useTranslations('nav');

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 pt-4">
        {/* Logo */}
        <div className="flex h-12 shrink-0 items-center">
          <Logo href="/dashboard" size="sm" />
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
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.nameKey}>
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
                    {t(item.nameKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
