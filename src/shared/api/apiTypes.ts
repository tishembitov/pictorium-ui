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

// Presigned upload request/response (Storage Service)
export interface PresignedUploadRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  category?: string;
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

export interface PresignedUploadResponse {
  imageId: string;
  uploadUrl: string;
  expiresAt: number;
  requiredHeaders?: Record<string, string>;
  thumbnailImageId?: string;
}

// Confirm upload request/response
export interface ConfirmUploadRequest {
  imageId: string;
  thumbnailImageId?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
}

export interface ConfirmUploadResponse {
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  size: number;
  contentType: string;
  updatedAt: string;
  confirmed: boolean;
}

// Image URL response
export interface ImageUrlResponse {
  imageId: string;
  url: string;
  expiresAt: number;
}

// Image metadata
export interface ImageMetadata {
  imageId: string;
  fileName: string;
  contentType: string;
  size: number;
  etag?: string;
  updatedAt: string;
  bucketName: string;
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