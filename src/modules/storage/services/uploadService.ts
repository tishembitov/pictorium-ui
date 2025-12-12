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
   * Upload a single file
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
    } = options;

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 1: Get presigned URL
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
      await this.uploadWithRetry(
        presignedResponse.uploadUrl,
        file,
        presignedResponse.requiredHeaders,
        onProgress
      );

      // Step 3: Confirm upload
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
      const err = error instanceof Error ? error : new Error('Upload failed');
      onError?.(err);
      throw err;
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
    attempt: number = 1
  ): Promise<void> {
    try {
      await uploadToPresignedUrl(url, file, headers, (percentage) => {
        onProgress?.({
          loaded: Math.round((percentage / 100) * file.size),
          total: file.size,
          percentage,
        });
      });
    } catch (error) {
      if (attempt < (this.config.retryAttempts || 3)) {
        await this.delay(this.config.retryDelay || 1000);
        return this.uploadWithRetry(url, file, headers, onProgress, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options: UploadOptions & { maxConcurrent?: number } = {}
  ): Promise<UploadResult[]> {
    const { maxConcurrent = 3, ...uploadOptions } = options;
    const results: UploadResult[] = [];
    const errors: Error[] = [];

    // Process files in chunks
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const chunk = files.slice(i, i + maxConcurrent);
      const chunkResults = await Promise.allSettled(
        chunk.map((file) => this.uploadFile(file, uploadOptions))
      );

      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push(result.reason);
        }
      });
    }

    if (errors.length > 0 && results.length === 0) {
      throw errors[0];
    }

    return results;
  }

  /**
   * Get image URL (with caching consideration)
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

// Singleton instance
export const uploadService = new UploadService();

export default uploadService;