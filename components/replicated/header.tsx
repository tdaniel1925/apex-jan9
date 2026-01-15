'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Agent } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { MarketingLanguageSwitcher } from '@/components/marketing-language-switcher';

interface ReplicatedSiteHeaderProps {
  agent: Agent;
  agentCode: string;
  basePath?: 'join' | 'team'; // 'join' for legacy agent_code, 'team' for username
}

// Navigation - internal links stay within replicated site, external go to main site
const navigation = [
  { name: 'Home', href: '', internal: true },
  { name: 'About Me', href: '/about-me', internal: true },
  { name: 'Carriers', href: '/carriers', internal: false },
  { name: 'Compare', href: '/compare', internal: false },
  { name: 'Opportunity', href: '/opportunity', internal: true },
  { name: 'FAQ', href: '/faq', internal: false },
  { name: 'Contact', href: '/contact', internal: true },
];

export function ReplicatedSiteHeader({ agent, agentCode, basePath: basePathProp = 'join' }: ReplicatedSiteHeaderProps) {
  const pathname = usePathname();
  const basePath = `/${basePathProp}/${agentCode}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar with agent info */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={agent.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
                    {agent.first_name[0]}{agent.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  Your Agent: {agent.first_name} {agent.last_name}
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="flex items-center gap-1 hover:underline">
                  <Phone className="h-3 w-3" />
                  {agent.phone}
                </a>
              )}
              <a href={`mailto:${agent.email}`} className="flex items-center gap-1 hover:underline">
                <Mail className="h-3 w-3" />
                {agent.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="w-[140px]">
            <Logo href={basePath} size="sm" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const href = item.internal ? `${basePath}${item.href}` : item.href;
              const isActive = item.internal && (pathname === href || (item.href === '' && pathname === basePath));
              return (
                <Link
                  key={item.name}
                  href={href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* CTA Button & Language Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            <MarketingLanguageSwitcher />
            <Button asChild>
              <Link href={`${basePath}/signup`}>Join Our Team</Link>
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <MarketingLanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-4 mt-8">
                {navigation.map((item) => {
                  const href = item.internal ? `${basePath}${item.href}` : item.href;
                  const isActive = item.internal && (pathname === href || (item.href === '' && pathname === basePath));
                  return (
                    <Link
                      key={item.name}
                      href={href}
                      className={cn(
                        'px-4 py-3 text-lg font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
                <div className="pt-4 border-t">
                  <Button asChild className="w-full">
                    <Link href={`${basePath}/signup`}>Join Our Team</Link>
                  </Button>
                </div>
                <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {agent.phone}
                    </a>
                  )}
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {agent.email}
                  </a>
                </div>
              </div>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
