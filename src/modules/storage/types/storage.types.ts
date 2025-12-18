// src/modules/storage/types/storage.types.ts

// ===== Request Types =====

/**
 * Request for getting presigned upload URL
 */
export interface PresignedUploadRequest {
  fileName: string;      // minLength: 1
  contentType: string;   // minLength: 1
  fileSize: number;      // minimum: 1
  category?: string;
  originalWidth: number;
  originalHeight: number;
  generateThumbnail?: boolean;
  thumbnailWidth?: number; // default 236
}

/**
 * Request for confirming upload
 */
export interface ConfirmUploadRequest {
  imageId: string;           // minLength: 1, required
  thumbnailImageId?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
}

// ===== Response Types =====

/**
 * Response with presigned upload URL
 */
export interface PresignedUploadResponse {
  imageId: string;
  uploadUrl: string;
  expiresAt: number;
  requiredHeaders?: Record<string, string>;
  thumbnailImageId?: string;
  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

/**
 * Response after confirming upload
 */
export interface ConfirmUploadResponse {
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  size: number;
  contentType: string;
  updatedAt: string;  // date-time
  confirmed: boolean;
  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

/**
 * Response with image URL
 */
export interface ImageUrlResponse {
  imageId: string;
  url: string;
  expiresAt: number;
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  imageId: string;
  fileName: string;
  contentType: string;
  size: number;
  etag?: string;
  updatedAt: string;  // date-time
  bucketName?: string;
}

// ===== Upload Types =====

export type UploadStatus = 
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'confirming'
  | 'completed'
  | 'error'
  | 'cancelled';  // Добавлено для поддержки отмены

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: UploadProgress;
  imageId?: string;
  thumbnailId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  category?: string;
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  startedAt?: number;
  completedAt?: number;
  abortController?: AbortController;  // Добавлено для отмены
}

export interface UploadOptions {
  category?: string;
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;  // Добавлено для отмены
}

export interface UploadResult {
  imageId: string;
  imageUrl: string;
  thumbnailId?: string;
  thumbnailUrl?: string;
  fileName: string;
  size: number;
  contentType: string;

  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export type ImageCategory = 'pins' | 'avatars' | 'banners' | 'comments';

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

export interface ImageDimensions {
  width: number;
  height: number;
}