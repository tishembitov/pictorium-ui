// src/composables/api/useStorage.ts
/**
 * useStorage - Работа с Storage Service
 *
 * NOTE: Для загрузки файлов с preview используйте useFileUpload из features/
 */

import { ref, computed } from 'vue'
import { storageApi } from '@/api/storage.api'
import type {
  ImageMetadata,
  ConfirmUploadResponse,
  ImageUrlResponse,
} from '@/types'

export interface UploadImageOptions {
  category?: string
  generateThumbnail?: boolean
  thumbnailWidth?: number
  thumbnailHeight?: number
}

export function useStorage() {
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const uploadedImageId = ref<string | null>(null)
  const uploadedUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function uploadImage(
    file: File,
    options?: UploadImageOptions,
  ): Promise<ConfirmUploadResponse> {
    try {
      isUploading.value = true
      uploadProgress.value = 0
      error.value = null

      // Используем новый presigned upload API
      const response = await storageApi.uploadImage(file, options)

      uploadedImageId.value = response.imageId
      uploadedUrl.value = response.imageUrl
      uploadProgress.value = 100

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed'
      throw err
    } finally {
      isUploading.value = false
    }
  }

  async function downloadImage(imageId: string): Promise<Blob> {
    return await storageApi.downloadImage(imageId)
  }

  async function getImageUrl(imageId: string, expiry?: number): Promise<string> {
    const response: ImageUrlResponse = await storageApi.getImageUrl(imageId, expiry)
    return response.url
  }

  async function getImageMetadata(imageId: string): Promise<ImageMetadata> {
    return await storageApi.getImageMetadata(imageId)
  }

  async function deleteImage(imageId: string): Promise<void> {
    return await storageApi.deleteImage(imageId)
  }

  function reset() {
    uploadedImageId.value = null
    uploadedUrl.value = null
    uploadProgress.value = 0
    error.value = null
  }

  return {
    isUploading: computed(() => isUploading.value),
    uploadProgress: computed(() => uploadProgress.value),
    uploadedImageId: computed(() => uploadedImageId.value),
    uploadedUrl: computed(() => uploadedUrl.value),
    error: computed(() => error.value),
    uploadImage,
    downloadImage,
    getImageUrl,
    getImageMetadata,
    deleteImage,
    reset,
  }
}
