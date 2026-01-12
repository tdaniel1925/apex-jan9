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
  ExternalLink,
  ShoppingBag,
  Package,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface SidebarProps {
  agent: Agent;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Genealogy', href: '/dashboard/genealogy', icon: Network },
  { name: 'Commissions', href: '/dashboard/commissions', icon: DollarSign },
  { name: 'Bonuses', href: '/dashboard/bonuses', icon: Award },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Shop', href: '/dashboard/shop', icon: ShoppingBag },
  { name: 'Orders', href: '/dashboard/orders', icon: Package },
  { name: 'CRM', href: '/dashboard/crm', icon: Contact },
  { name: 'Training', href: '/dashboard/training', icon: BookOpen },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ agent }: SidebarProps) {
  const pathname = usePathname();
  const rankConfig = RANK_CONFIG[agent.rank];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4">
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center py-4">
          <Logo href="/dashboard" size="md" variant="white" />
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

        {/* View Website Link */}
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/join/${agent.agent_code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-x-3 rounded-md p-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          View Website
        </a>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

        {/* AI Copilot Upsell */}
        {agent.ai_copilot_tier === 'none' && (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-4">
            <p className="text-sm font-medium text-sidebar-foreground">
              Upgrade to AI Copilot
            </p>
            <p className="mt-1 text-xs text-sidebar-foreground/70">
              Get AI-powered assistance for your sales and recruiting.
            </p>
            <Link
              href="/dashboard/settings/copilot"
              className="mt-3 inline-block text-xs font-medium text-sidebar-primary hover:underline"
            >
              Learn More
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
