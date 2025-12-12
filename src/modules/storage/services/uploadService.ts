// src/modules/storage/services/uploadService.ts

import { uploadToPresignedUrl } from '@/shared/api/apiClient';
import { storageApi } from '../api/storageApi';
import { validateImageFile } from '../utils/fileUtils';
import type {
  UploadOptions,
  UploadResult,
  UploadProgress,
  PresignedUploadRequest,
} from '../types/storage.types';

export interface UploadServiceConfig {
  retryAttempts?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: UploadServiceConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
};

class UploadService {
  private readonly config: UploadServiceConfig;

  constructor(config: UploadServiceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Upload a single file with cancellation support
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      category,
      generateThumbnail = false,
      thumbnailWidth,
      thumbnailHeight,
      onProgress,
      onSuccess,
      onError,
      signal,
    } = options;

    try {
      // Check for cancellation
      this.checkAborted(signal);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 1: Get presigned URL
      this.checkAborted(signal);
      const presignedRequest: PresignedUploadRequest = {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        category,
        generateThumbnail,
        thumbnailWidth,
        thumbnailHeight,
      };

      const presignedResponse = await storageApi.getPresignedUploadUrl(presignedRequest);

      // Step 2: Upload to presigned URL
      this.checkAborted(signal);
      await this.uploadWithRetry(
        presignedResponse.uploadUrl,
        file,
        presignedResponse.requiredHeaders,
        onProgress,
        signal
      );

      // Step 3: Confirm upload
      this.checkAborted(signal);
      const confirmResponse = await storageApi.confirmUpload({
        imageId: presignedResponse.imageId,
        thumbnailImageId: presignedResponse.thumbnailImageId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      const result: UploadResult = {
        imageId: confirmResponse.imageId,
        imageUrl: confirmResponse.imageUrl,
        thumbnailId: presignedResponse.thumbnailImageId,
        thumbnailUrl: confirmResponse.thumbnailUrl,
        fileName: confirmResponse.fileName,
        size: confirmResponse.size,
        contentType: confirmResponse.contentType,
      };

      onSuccess?.(result);
      return result;
    } catch (error) {
      // Handle cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        const cancelError = new Error('Upload cancelled');
        cancelError.name = 'AbortError';
        onError?.(cancelError);
        throw cancelError;
      }

      const err = error instanceof Error ? error : new Error('Upload failed');
      onError?.(err);
      throw err;
    }
  }

  /**
   * Check if operation was aborted
   */
  private checkAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      const error = new Error('Upload cancelled');
      error.name = 'AbortError';
      throw error;
    }
  }

  /**
   * Upload with retry logic
   */
  private async uploadWithRetry(
    url: string,
    file: File,
    headers?: Record<string, string>,
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal,
    attempt: number = 1
  ): Promise<void> {
    try {
      this.checkAborted(signal);
      
      await uploadToPresignedUrl(url, file, headers, (percentage) => {
        onProgress?.({
          loaded: Math.round((percentage / 100) * file.size),
          total: file.size,
          percentage,
        });
      });
    } catch (error) {
      // Don't retry on cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      if (attempt < (this.config.retryAttempts || 3)) {
        await this.delay(this.config.retryDelay || 1000);
        return this.uploadWithRetry(url, file, headers, onProgress, signal, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Upload multiple files with concurrency control
   */
  async uploadFiles(
    files: File[],
    options: UploadOptions & { maxConcurrent?: number } = {}
  ): Promise<UploadResult[]> {
    const { maxConcurrent = 3, signal, ...uploadOptions } = options;
    const results: UploadResult[] = [];
    const errors: Error[] = [];

    // Process files in chunks
    for (let i = 0; i < files.length; i += maxConcurrent) {
      // Check for cancellation before each chunk
      this.checkAborted(signal);

      const chunk = files.slice(i, i + maxConcurrent);
      const chunkResults = await Promise.allSettled(
        chunk.map((file) => this.uploadFile(file, { ...uploadOptions, signal }))
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Stop on cancellation
          if (result.reason?.name === 'AbortError') {
            throw result.reason;
          }
          errors.push(result.reason);
        }
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw errors[0];
    }

    return results;
  }

  /**
   * Get image URL
   */
  async getImageUrl(imageId: string, expiry?: number): Promise<string> {
    const response = await storageApi.getImageUrl(imageId, expiry);
    return response.url;
  }

  /**
   * Delete image
   */
  async deleteImage(imageId: string): Promise<void> {
    await storageApi.deleteImage(imageId);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const uploadService = new UploadService();

export default uploadService;