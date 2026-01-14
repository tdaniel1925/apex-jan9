/**
 * Robots.txt Generator
 * Controls search engine crawling
 */

import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/admin-login',
          '/_next/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
