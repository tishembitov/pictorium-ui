// src/modules/storage/types/storage.types.ts

// ===== Request Types =====

/**
 * Request for getting presigned upload URL
 */
export interface PresignedUploadRequest {
    fileName: string;
    contentType: string;
    fileSize: number;
    category?: string;
    generateThumbnail?: boolean;
    thumbnailWidth?: number;
    thumbnailHeight?: number;
  }
  
  /**
   * Request for confirming upload
   */
  export interface ConfirmUploadRequest {
    imageId: string;
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
    updatedAt: string;
    confirmed: boolean;
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
    updatedAt: string;
    bucketName?: string;
  }
  
  // ===== Upload Types =====
  
  /**
   * Upload status
   */
  export type UploadStatus = 
    | 'idle'
    | 'preparing'
    | 'uploading'
    | 'confirming'
    | 'completed'
    | 'error';
  
  /**
   * Upload progress info
   */
  export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
  }
  
  /**
   * Upload item in queue
   */
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
  }
  
  /**
   * Upload options
   */
  export interface UploadOptions {
    category?: string;
    generateThumbnail?: boolean;
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    onProgress?: (progress: UploadProgress) => void;
    onSuccess?: (result: UploadResult) => void;
    onError?: (error: Error) => void;
  }
  
  /**
   * Upload result
   */
  export interface UploadResult {
    imageId: string;
    imageUrl: string;
    thumbnailId?: string;
    thumbnailUrl?: string;
    fileName: string;
    size: number;
    contentType: string;
  }
  
  /**
   * Image category for organization
   */
  export type ImageCategory = 'pins' | 'avatars' | 'banners' | 'comments';
  
  /**
   * Thumbnail options
   */
  export interface ThumbnailOptions {
    width: number;
    height: number;
    quality?: number;
  }
  
  /**
   * File validation result
   */
  export interface FileValidationResult {
    valid: boolean;
    error?: string;
    file?: File;
  }
  
  /**
   * Image dimensions
   */
  export interface ImageDimensions {
    width: number;
    height: number;
  }