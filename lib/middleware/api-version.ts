/**
 * API Versioning Middleware
 * Phase 2 - Issue #35: Support multiple API versions for backwards compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

export const API_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = typeof API_VERSIONS[number];

export const CURRENT_VERSION: ApiVersion = 'v1';
export const LATEST_VERSION: ApiVersion = 'v1';

/**
 * Extract API version from request
 * Supports multiple version detection methods:
 * 1. URL path: /api/v1/agents
 * 2. Header: X-API-Version: v1
 * 3. Query param: ?api_version=v1
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  // Method 1: Extract from URL path
  const pathMatch = request.nextUrl.pathname.match(/\/api\/(v\d+)\//);
  if (pathMatch && pathMatch[1]) {
    const version = pathMatch[1] as ApiVersion;
    if (API_VERSIONS.includes(version)) {
      return version;
    }
  }

  // Method 2: Check header
  const headerVersion = request.headers.get('X-API-Version');
  if (headerVersion && API_VERSIONS.includes(headerVersion as ApiVersion)) {
    return headerVersion as ApiVersion;
  }

  // Method 3: Check query parameter
  const queryVersion = request.nextUrl.searchParams.get('api_version');
  if (queryVersion && API_VERSIONS.includes(queryVersion as ApiVersion)) {
    return queryVersion as ApiVersion;
  }

  // Default to current version
  return CURRENT_VERSION;
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(response: NextResponse, version: ApiVersion): NextResponse {
  response.headers.set('X-API-Version', version);
  response.headers.set('X-API-Latest-Version', LATEST_VERSION);

  // Add deprecation warning if using old version
  if (version !== LATEST_VERSION) {
    response.headers.set(
      'X-API-Deprecated',
      `API version ${version} is deprecated. Please upgrade to ${LATEST_VERSION}`
    );
  }

  return response;
}

/**
 * Version compatibility check
 */
export function isVersionSupported(version: string): boolean {
  return API_VERSIONS.includes(version as ApiVersion);
}

/**
 * Deprecation notice
 */
export interface DeprecationNotice {
  deprecated: boolean;
  message?: string;
  sunsetDate?: string;
  upgradeGuide?: string;
}

export function getDeprecationNotice(version: ApiVersion): DeprecationNotice {
  // Add deprecation notices here
  const deprecations: Partial<Record<ApiVersion, DeprecationNotice>> = {
    // Example:
    // 'v1': {
    //   deprecated: true,
    //   message: 'API v1 will be sunset on 2026-12-31',
    //   sunsetDate: '2026-12-31',
    //   upgradeGuide: 'https://docs.theapexway.net/api/v1-to-v2-migration'
    // }
  };

  return deprecations[version] || { deprecated: false };
}
