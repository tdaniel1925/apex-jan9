/**
 * i18n Routing Configuration
 * Defines how locales are handled in URLs
 */

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Don't show locale prefix for default locale (English)
  // URLs: /dashboard (en), /es/dashboard (es), /zh/dashboard (zh)
  localePrefix: 'as-needed',
});

// Export navigation helpers that are locale-aware
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
