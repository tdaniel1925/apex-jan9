import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableSearch } from '@/lib/hooks/use-table-search';

// Mock Next.js navigation
const mockReplace = vi.fn();
const mockSearchParams = new Map<string, string>();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) || null,
  }),
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('useTableSearch', () => {
  const mockData = [
    { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', status: 'active', rank: 'associate' },
    { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', status: 'inactive', rank: 'senior' },
    { id: '3', first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com', status: 'active', rank: 'associate' },
    { id: '4', first_name: 'Alice', last_name: 'Williams', email: 'alice@example.com', status: 'pending', rank: 'senior' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/test',
        search: '',
      },
      writable: true,
    });
  });

  describe('search functionality', () => {
    it('should filter data by search term across multiple keys', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name', 'last_name', 'email'],
          enableUrlParams: false,
        })
      );

      // Initially shows all data
      expect(result.current.filtered).toHaveLength(4);

      // Search by first name
      act(() => {
        result.current.setSearch('john');
      });
      expect(result.current.filtered).toHaveLength(2); // John Doe and Bob Johnson
      expect(result.current.filtered[0].first_name).toBe('John');
      expect(result.current.filtered[1].last_name).toBe('Johnson');

      // Search by email
      act(() => {
        result.current.setSearch('jane@');
      });
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].email).toBe('jane@example.com');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setSearch('JOHN');
      });
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].first_name).toBe('John');
    });

    it('should handle empty search', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setSearch('');
      });
      expect(result.current.filtered).toHaveLength(4);
    });
  });

  describe('filter functionality', () => {
    it('should filter by single value', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setFilter('status', 'active');
      });
      expect(result.current.filtered).toHaveLength(2);
      expect(result.current.filtered.every((item) => item.status === 'active')).toBe(true);
    });

    it('should filter by multiple values', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['rank'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setFilter('rank', ['associate', 'senior']);
      });
      expect(result.current.filtered).toHaveLength(4); // All have associate or senior rank
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status', 'rank'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setFilter('status', 'active');
        result.current.setFilter('rank', 'associate');
      });
      expect(result.current.filtered).toHaveLength(2); // John and Bob
      expect(result.current.filtered.every((item) => item.status === 'active' && item.rank === 'associate')).toBe(
        true
      );
    });

    it('should combine search and filters', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name', 'last_name'],
          filterKeys: ['status'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setSearch('john');
        result.current.setFilter('status', 'active');
      });
      expect(result.current.filtered).toHaveLength(2); // John Doe and Bob Johnson (both active, both contain "john")
      expect(result.current.filtered[0].first_name).toBe('John');
      expect(result.current.filtered[1].first_name).toBe('Bob');
    });

    it('should remove filter when set to null', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setFilter('status', 'active');
      });
      expect(result.current.filtered).toHaveLength(2);

      act(() => {
        result.current.setFilter('status', null);
      });
      expect(result.current.filtered).toHaveLength(4);
    });

    it('should remove filter when set to empty string', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setFilter('status', 'active');
      });
      expect(result.current.filtered).toHaveLength(2);

      act(() => {
        result.current.setFilter('status', '');
      });
      expect(result.current.filtered).toHaveLength(4);
    });
  });

  describe('clearFilters', () => {
    it('should clear search and all filters', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status', 'rank'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setSearch('john');
        result.current.setFilter('status', 'active');
        result.current.setFilter('rank', 'associate');
      });
      expect(result.current.filtered).toHaveLength(1);

      act(() => {
        result.current.clearFilters();
      });
      expect(result.current.search).toBe('');
      expect(result.current.filters).toEqual({});
      expect(result.current.filtered).toHaveLength(4);
    });
  });

  describe('active filter tracking', () => {
    it('should track active filters correctly', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status', 'rank'],
          enableUrlParams: false,
        })
      );

      // No filters active
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.activeFilterCount).toBe(0);

      // Search active
      act(() => {
        result.current.setSearch('john');
      });
      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.activeFilterCount).toBe(1);

      // Search + filter
      act(() => {
        result.current.setFilter('status', 'active');
      });
      expect(result.current.activeFilterCount).toBe(2);

      // Search + 2 filters
      act(() => {
        result.current.setFilter('rank', 'associate');
      });
      expect(result.current.activeFilterCount).toBe(3);

      // Clear all
      act(() => {
        result.current.clearFilters();
      });
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.activeFilterCount).toBe(0);
    });
  });

  describe('URL params integration', () => {
    it('should initialize from URL params', () => {
      mockSearchParams.set('search', 'john');
      mockSearchParams.set('status', 'active');

      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status'],
          enableUrlParams: true,
        })
      );

      expect(result.current.search).toBe('john');
      expect(result.current.filters.status).toBe('active');
      expect(result.current.filtered).toHaveLength(1); // Bob Johnson (active + contains "john")
    });

    it('should update URL params when filters change', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status'],
          enableUrlParams: true,
        })
      );

      act(() => {
        result.current.setSearch('john');
      });

      // Should call router.replace with query params
      expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('search=john'), { scroll: false });
    });

    it('should handle multiple values in URL params', () => {
      mockSearchParams.set('rank', 'associate,senior');

      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['rank'],
          enableUrlParams: true,
        })
      );

      expect(result.current.filters.rank).toEqual(['associate', 'senior']);
    });

    it('should not sync to URL when disabled', () => {
      const { result } = renderHook(() =>
        useTableSearch(mockData, {
          searchKeys: ['first_name'],
          filterKeys: ['status'],
          enableUrlParams: false,
        })
      );

      act(() => {
        result.current.setSearch('john');
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty data array', () => {
      const { result } = renderHook(() =>
        useTableSearch([], {
          searchKeys: ['first_name'],
          enableUrlParams: false,
        })
      );

      expect(result.current.filtered).toHaveLength(0);

      act(() => {
        result.current.setSearch('test');
      });
      expect(result.current.filtered).toHaveLength(0);
    });

    it('should handle null/undefined values in data', () => {
      const dataWithNulls = [
        { id: '1', name: 'John', status: null },
        { id: '2', name: null, status: 'active' },
        { id: '3', name: 'Jane', status: undefined },
      ];

      const { result } = renderHook(() =>
        useTableSearch(dataWithNulls, {
          searchKeys: ['name'],
          filterKeys: ['status'],
          enableUrlParams: false,
        })
      );

      // Search should skip null values
      act(() => {
        result.current.setSearch('john');
      });
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].name).toBe('John');

      // Filter should skip null/undefined values
      act(() => {
        result.current.setSearch('');
        result.current.setFilter('status', 'active');
      });
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].id).toBe('2');
    });
  });
});
