'use client';

/**
 * Marketing Language Switcher Component
 * Simple language switcher for marketing pages that uses standard navigation
 */

import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Locale = 'en' | 'es' | 'zh';

const locales: Locale[] = ['en', 'es', 'zh'];

const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
};

const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  zh: '🇨🇳',
};

interface MarketingLanguageSwitcherProps {
  className?: string;
}

export function MarketingLanguageSwitcher({ className }: MarketingLanguageSwitcherProps) {
  const pathname = usePathname();

  // Extract current locale from pathname
  const localeMatch = pathname.match(/^\/(en|es|zh)(\/.*)?$/);
  const currentLocale: Locale = localeMatch ? (localeMatch[1] as Locale) : 'en';
  const pathWithoutLocale = localeMatch ? (localeMatch[2] || '/') : pathname;

  const handleLocaleChange = (newLocale: Locale) => {
    // For default locale (en), remove prefix
    // For other locales, add prefix
    let newPath: string;
    if (newLocale === 'en') {
      newPath = pathWithoutLocale || '/';
    } else {
      newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    }

    // Use window.location for full page navigation to ensure middleware runs
    window.location.href = newPath;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', className)}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {localeFlags[currentLocale]} {localeNames[currentLocale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={cn(
              'cursor-pointer gap-2',
              currentLocale === loc && 'bg-accent'
            )}
          >
            <span>{localeFlags[loc]}</span>
            <span>{localeNames[loc]}</span>
            {currentLocale === loc && (
              <span className="ml-auto text-xs text-muted-foreground">
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
