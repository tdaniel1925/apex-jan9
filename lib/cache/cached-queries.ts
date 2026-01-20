/**
 * Cached Database Queries
 * Phase 2 - Issue #25: Wrapper functions for commonly accessed data
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import { configCache, CacheKeys, CacheTTL } from './config-cache';
import type { Product } from '@/lib/types/database';

/**
 * Get all products with caching
 */
export async function getCachedProducts(): Promise<Product[]> {
  return configCache.get(
    CacheKeys.PRODUCTS,
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return (data || []) as Product[];
    },
    CacheTTL.LONG
  );
}

/**
 * Get single product by ID with caching
 */
export async function getCachedProduct(productId: string): Promise<Product | null> {
  return configCache.get(
    CacheKeys.PRODUCT(productId),
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return data as Product;
    },
    CacheTTL.LONG
  );
}

/**
 * Get rank requirements with caching
 * Note: In actual implementation, this would fetch from database
 */
export async function getCachedRankRequirements() {
  return configCache.get(
    CacheKeys.RANK_REQUIREMENTS,
    async () => {
      // This would fetch from database if stored there
      // For now, return from config file
      const { RANK_CONFIG } = await import('@/lib/config/ranks');
      return RANK_CONFIG;
    },
    CacheTTL.VERY_LONG // Rank requirements rarely change
  );
}

/**
 * Get system settings with caching
 */
export async function getCachedSystemSettings() {
  return configCache.get(
    CacheKeys.SYSTEM_SETTINGS,
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching system settings:', error);
        return {};
      }

      return data || {};
    },
    CacheTTL.MEDIUM
  );
}

/**
 * Get copilot tier limits with caching
 */
export async function getCachedCopilotTiers() {
  return configCache.get(
    CacheKeys.COPILOT_TIERS,
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('copilot_tier_limits')
        .select('*')
        .order('monthly_message_limit', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching copilot tiers:', error);
        return [];
      }

      return data || [];
    },
    CacheTTL.VERY_LONG
  );
}

/**
 * Invalidate product cache (call after product updates)
 */
export function invalidateProductCache(productId?: string) {
  if (productId) {
    configCache.invalidate(CacheKeys.PRODUCT(productId));
  }
  configCache.invalidate(CacheKeys.PRODUCTS);
}

/**
 * Invalidate settings cache (call after settings updates)
 */
export function invalidateSettingsCache() {
  configCache.invalidate(CacheKeys.SYSTEM_SETTINGS);
  configCache.invalidate(CacheKeys.COMMISSION_RATES);
  configCache.invalidate(CacheKeys.WITHDRAWAL_LIMITS);
}
