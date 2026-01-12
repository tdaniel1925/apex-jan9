import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface UseTableSearchOptions {
  searchKeys: string[];
  filterKeys?: string[];
  enableUrlParams?: boolean;
}

interface FilterState {
  [key: string]: string | string[];
}

interface UseTableSearchReturn<T> {
  filtered: T[];
  search: string;
  setSearch: (value: string) => void;
  filters: FilterState;
  setFilter: (key: string, value: string | string[] | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

/**
 * Generic search and filter hook for table data
 *
 * Features:
 * - Client-side search across multiple keys
 * - Multiple filter support
 * - URL query params (optional)
 * - Clear all filters
 * - Active filter tracking
 *
 * @example
 * ```typescript
 * const { filtered, search, setSearch, filters, setFilter, clearFilters } = useTableSearch(data, {
 *   searchKeys: ['first_name', 'last_name', 'email'],
 *   filterKeys: ['status', 'rank'],
 *   enableUrlParams: true
 * });
 * ```
 */
export function useTableSearch<T extends Record<string, any>>(
  data: T[],
  options: UseTableSearchOptions
): UseTableSearchReturn<T> {
  const { searchKeys, filterKeys = [], enableUrlParams = true } = options;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize from URL params if enabled
  const initialSearch = enableUrlParams ? (searchParams?.get('search') || '') : '';
  const initialFilters: FilterState = {};

  if (enableUrlParams && searchParams) {
    filterKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        initialFilters[key] = value.includes(',') ? value.split(',') : value;
      }
    });
  }

  const [search, setSearchState] = useState(initialSearch);
  const [filters, setFiltersState] = useState<FilterState>(initialFilters);

  // Update URL params when search/filters change
  useEffect(() => {
    if (!enableUrlParams || typeof window === 'undefined') return;

    const params = new URLSearchParams();

    if (search) {
      params.set('search', search);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const stringValue = Array.isArray(value) ? value.join(',') : value;
        if (stringValue) {
          params.set(key, stringValue);
        }
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Update URL without navigation
    if (window.location.search !== `?${queryString}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [search, filters, enableUrlParams, router]);

  // Public setter functions
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const setFilter = useCallback((key: string, value: string | string[] | null) => {
    setFiltersState((prev) => {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchState('');
    setFiltersState({});
  }, []);

  // Filter data
  const filtered = useMemo(() => {
    let result = [...data];

    // Apply search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowerSearch);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      result = result.filter((item) => {
        const itemValue = item[key];
        if (itemValue === null || itemValue === undefined) return false;

        // Array filter (multiple values)
        if (Array.isArray(value)) {
          return value.some((v) => String(itemValue).toLowerCase() === v.toLowerCase());
        }

        // Single value filter
        return String(itemValue).toLowerCase() === String(value).toLowerCase();
      });
    });

    return result;
  }, [data, search, filters, searchKeys]);

  // Active filter tracking
  const hasActiveFilters = search.length > 0 || Object.keys(filters).length > 0;
  const activeFilterCount = (search ? 1 : 0) + Object.keys(filters).length;

  return {
    filtered,
    search,
    setSearch,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
