import type { PageResponse, Pageable } from '../types/pageable.types';

// Re-export for convenience
export type { PageResponse, Pageable };

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request config
export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// Paginated request params
export interface PaginatedRequest extends Pageable {
  [key: string]: any;
}

// Generic list response (non-paginated)
export type ListResponse<T> = T[];

// API Error structure
export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
  errors?: ValidationError[];
}

// Validation error from Spring
export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

// Upload progress event
export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

// Common filter params
export interface BaseFilterParams {
  q?: string;
  createdFrom?: string;
  createdTo?: string;
}

// Sort params helper
export const createSortParam = (field: string, direction: 'asc' | 'desc' = 'desc'): string => {
  return `${field},${direction}`;
};

// Pagination params helper
export const createPaginationParams = (pageable: Pageable): Record<string, any> => {
  const params: Record<string, any> = {};
  
  if (pageable.page !== undefined) {
    params.page = pageable.page;
  }
  if (pageable.size !== undefined) {
    params.size = pageable.size;
  }
  if (pageable.sort && pageable.sort.length > 0) {
    params.sort = pageable.sort;
  }
  
  return params;
};