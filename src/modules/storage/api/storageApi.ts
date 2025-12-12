// src/modules/storage/api/storageApi.ts

import type { AxiosRequestConfig } from 'axios';
import { get, post, del } from '@/shared/api/apiClient';
import { IMAGE_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type {
  PresignedUploadRequest,
  PresignedUploadResponse,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  ImageUrlResponse,
  ImageMetadata,
} from '../types/storage.types';

/**
 * Storage API client
 */
export const storageApi = {
  /**
   * Get presigned URL for uploading image
   */
  getPresignedUploadUrl: (request: PresignedUploadRequest) => {
    return post<PresignedUploadResponse>(
      IMAGE_ENDPOINTS.presignedUpload(),
      request
    );
  },

  /**
   * Confirm image upload
   */
  confirmUpload: (request: ConfirmUploadRequest) => {
    return post<ConfirmUploadResponse>(
      IMAGE_ENDPOINTS.confirm(),
      request
    );
  },

  /**
   * Get image URL with optional expiry
   */
  getImageUrl: (imageId: string, expiry?: number) => {
    const params = expiry ? { expiry } : undefined;
    return get<ImageUrlResponse>(
      IMAGE_ENDPOINTS.url(imageId),
      { params }
    );
  },

  /**
   * Get image metadata
   */
  getImageMetadata: (imageId: string) => {
    return get<ImageMetadata>(IMAGE_ENDPOINTS.metadata(imageId));
  },

  /**
   * Delete image
   */
  deleteImage: (imageId: string) => {
    return del<void>(IMAGE_ENDPOINTS.delete(imageId));
  },

  /**
   * List images by category
   */
  listImages: (category?: string) => {
    const params = category ? { category } : undefined;
    return get<ImageMetadata[]>(IMAGE_ENDPOINTS.list(), { params });
  },

  /**
   * Download image (returns redirect to actual image)
   */
  downloadImage: (imageId: string) => {
    const config: AxiosRequestConfig = {
      responseType: 'blob',
    };
    return get<Blob>(IMAGE_ENDPOINTS.byId(imageId), config);
  },
};

export default storageApi;