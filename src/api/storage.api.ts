// src/api/storage.api.ts
import { storageServiceClient } from './client'
import type {
  PresignedUploadRequest,
  PresignedUploadResponse,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  ImageUrlResponse,
  GetImageMetadataResponse,
  ListImagesResponse,
} from '@/types'

const BASE_PATH = '/api/v1/images'

export const storageApi = {
  /**
   * Получить presigned URL для загрузки изображения
   */
  getPresignedUploadUrl: async (
    request: PresignedUploadRequest,
  ): Promise<PresignedUploadResponse> => {
    const { data } = await storageServiceClient.post(`${BASE_PATH}/presigned-upload`, request)
    return data
  },

  /**
   * Загрузить файл на presigned URL
   */
  uploadToPresignedUrl: async (
    uploadUrl: string,
    file: File,
    requiredHeaders: Record<string, string>,
  ): Promise<void> => {
    // Используем fetch для загрузки на presigned URL (может быть другой домен)
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        ...requiredHeaders,
        'Content-Type': file.type,
      },
      body: file,
    })
  },

  /**
   * Подтвердить загрузку изображения
   */
  confirmUpload: async (request: ConfirmUploadRequest): Promise<ConfirmUploadResponse> => {
    const { data } = await storageServiceClient.post(`${BASE_PATH}/confirm`, request)
    return data
  },

  /**
   * Полный процесс загрузки изображения (presigned upload + confirm)
   */
  uploadImage: async (
    file: File,
    options?: {
      category?: string
      generateThumbnail?: boolean
      thumbnailWidth?: number
      thumbnailHeight?: number
    },
  ): Promise<ConfirmUploadResponse> => {
    // 1. Получаем presigned URL
    const presignedRequest: PresignedUploadRequest = {
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      category: options?.category,
      generateThumbnail: options?.generateThumbnail,
      thumbnailWidth: options?.thumbnailWidth,
      thumbnailHeight: options?.thumbnailHeight,
    }

    const presignedResponse = await storageApi.getPresignedUploadUrl(presignedRequest)

    // 2. Загружаем файл на presigned URL
    await storageApi.uploadToPresignedUrl(
      presignedResponse.uploadUrl,
      file,
      presignedResponse.requiredHeaders,
    )

    // 3. Подтверждаем загрузку
    const confirmRequest: ConfirmUploadRequest = {
      imageId: presignedResponse.imageId,
      thumbnailImageId: presignedResponse.thumbnailImageId,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }

    return await storageApi.confirmUpload(confirmRequest)
  },

  /**
   * Скачать изображение
   */
  downloadImage: async (imageId: string): Promise<Blob> => {
    const { data } = await storageServiceClient.get(`${BASE_PATH}/${imageId}`, {
      responseType: 'blob',
    })
    return data
  },

  /**
   * Получить URL изображения
   */
  getImageUrl: async (imageId: string, expiry?: number): Promise<ImageUrlResponse> => {
    const { data } = await storageServiceClient.get(`${BASE_PATH}/${imageId}/url`, {
      params: { expiry },
    })
    return data
  },

  /**
   * Получить метаданные изображения
   */
  getImageMetadata: async (imageId: string): Promise<GetImageMetadataResponse> => {
    const { data } = await storageServiceClient.get(`${BASE_PATH}/${imageId}/metadata`)
    return data
  },

  /**
   * Получить список изображений
   */
  listImages: async (category?: string): Promise<ListImagesResponse> => {
    const { data } = await storageServiceClient.get(`${BASE_PATH}/list`, {
      params: { category },
    })
    return data
  },

  /**
   * Удалить изображение
   */
  deleteImage: async (imageId: string): Promise<void> => {
    await storageServiceClient.delete(`${BASE_PATH}/${imageId}`)
  },
}
