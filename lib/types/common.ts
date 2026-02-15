// Common TypeScript types used across the application

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type SortDirection = "asc" | "desc";

export type SortOptions = {
  field: string;
  direction: SortDirection;
};

export type FilterOptions = Record<string, unknown>;

export type PaginationOptions = {
  page: number;
  pageSize: number;
};
