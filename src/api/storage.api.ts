/**
 * Storage/Images API
 */

import { storageServiceClient } from './client'
import type {
  UploadImageResponse,
  GetImageMetadataResponse,
  ListImagesResponse,
  ImageUploadRequest,
} from '@/types'

const BASE_PATH = '/api/v1/images'

export const storageApi = {
  /**
   * Загрузить изображение
   */
  uploadImage: async (params: ImageUploadRequest): Promise<UploadImageResponse> => {
    const formData = new FormData()
    formData.append('file', params.file)

    if (params.category) formData.append('category', params.category)
    if (params.generateThumbnail !== undefined) {
      formData.append('generateThumbnail', String(params.generateThumbnail))
    }
    if (params.thumbnailWidth) formData.append('thumbnailWidth', String(params.thumbnailWidth))
    if (params.thumbnailHeight) formData.append('thumbnailHeight', String(params.thumbnailHeight))

    const { data } = await storageServiceClient.post(`${BASE_PATH}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
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
  getImageUrl: async (imageId: string, expiry?: number): Promise<string> => {
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
