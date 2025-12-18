// ================================================
// FILE: src/modules/storage/services/uploadService.ts
// ================================================

import { uploadToPresignedUrl } from '@/shared/api/apiClient';
import { storageApi } from '../api/storageApi';
import type {
  UploadOptions,
  UploadResult,
  UploadProgress,
  PresignedUploadRequest,
} from '../types/storage.types';
import { validateImageFile } from '../utils/fileUtils';
import { getImageDimensions } from '../utils/imageUtils';

const THUMBNAIL_WIDTH = 236; // Masonry column width

class UploadService {
  /**
   * Upload с автоматическим чтением размеров
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      category,
      onProgress,
      onSuccess,
      onError,
      signal,
    } = options;

    try {
      this.checkAborted(signal);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // === Step 1: Читаем размеры оригинала на фронтенде ===
      this.checkAborted(signal);
      const dimensions = await getImageDimensions(file);
      
      console.log('Image dimensions:', dimensions);

      // === Step 2: Запрашиваем presigned URL с размерами ===
      this.checkAborted(signal);
      const presignedRequest: PresignedUploadRequest = {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        category,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        generateThumbnail: true,
        thumbnailWidth: THUMBNAIL_WIDTH,
      };

      const presignedResponse = await storageApi.getPresignedUploadUrl(presignedRequest);

      console.log('Presigned response:', presignedResponse);

      // === Step 3: Загружаем в MinIO ===
      this.checkAborted(signal);
      await this.uploadWithRetry(
        presignedResponse.uploadUrl,
        file,
        presignedResponse.requiredHeaders,
        onProgress,
        signal
      );

      // === Step 4: Подтверждаем загрузку ===
      this.checkAborted(signal);
      const confirmResponse = await storageApi.confirmUpload({
        imageId: presignedResponse.imageId,
        thumbnailImageId: presignedResponse.thumbnailImageId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      console.log('Confirm response:', confirmResponse);

      // === Step 5: Возвращаем результат с размерами ===
      const result: UploadResult = {
        imageId: confirmResponse.imageId,
        imageUrl: confirmResponse.imageUrl,
        thumbnailId: presignedResponse.thumbnailImageId,
        thumbnailUrl: confirmResponse.thumbnailUrl,
        fileName: confirmResponse.fileName,
        size: confirmResponse.size,
        contentType: confirmResponse.contentType,
        // Размеры из ответа сервера
        originalWidth: confirmResponse.originalWidth,
        originalHeight: confirmResponse.originalHeight,
        thumbnailWidth: confirmResponse.thumbnailWidth,
        thumbnailHeight: confirmResponse.thumbnailHeight,
      };

      onSuccess?.(result);
      return result;
      
    } catch (error) {
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

  private checkAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      const error = new Error('Upload cancelled');
      error.name = 'AbortError';
      throw error;
    }
  }

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
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.uploadWithRetry(url, file, headers, onProgress, signal, attempt + 1);
      }
      throw error;
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;