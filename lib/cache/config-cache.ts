/**
 * Configuration Data Cache
 * Phase 2 - Issue #25: Cache frequently accessed config data
 *
 * Simple in-memory cache with TTL for config data that rarely changes
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ConfigCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached value or execute fetcher function
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached if still valid
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    this.cache.set(key, {
      data,
      expiresAt: now + ttl,
    });

    return data;
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const configCache = new ConfigCache();

// Cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => configCache.cleanup(), 60 * 1000);
}

/**
 * Cache keys for common config data
 */
export const CacheKeys = {
  RANK_REQUIREMENTS: 'config:rank_requirements',
  PRODUCTS: 'config:products',
  PRODUCT: (id: string) => `config:product:${id}`,
  COMMISSION_RATES: 'config:commission_rates',
  WITHDRAWAL_LIMITS: 'config:withdrawal_limits',
  EMAIL_TEMPLATES: 'config:email_templates',
  EMAIL_TEMPLATE: (id: string) => `config:email_template:${id}`,
  SYSTEM_SETTINGS: 'config:system_settings',
  COPILOT_TIERS: 'config:copilot_tiers',
} as const;

/**
 * Cache TTLs for different data types
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute (for rapidly changing data)
  MEDIUM: 5 * 60 * 1000, // 5 minutes (default)
  LONG: 15 * 60 * 1000, // 15 minutes (for rarely changing config)
  VERY_LONG: 60 * 60 * 1000, // 1 hour (for static data)
} as const;
