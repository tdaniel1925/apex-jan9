/**
 * i18n Configuration
 * Supported locales and default settings
 */

export const locales = ['en', 'es', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇲🇽',
  zh: '🇨🇳',
};

// Routes that should not be internationalized (API, static assets, etc.)
export const pathsToIgnore = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

// Check if a path should be internationalized
export function shouldInternationalize(pathname: string): boolean {
  return !pathsToIgnore.some(path => pathname.startsWith(path));
}
