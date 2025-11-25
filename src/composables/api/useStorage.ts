// src/composables/api/useStorage.ts
/**
 * useStorage - Работа с Storage Service
 *
 * NOTE: Для загрузки файлов с preview используйте useFileUpload из features/
 */

import { ref, computed, onUnmounted } from 'vue'
import { storageApi } from '@/api/storage.api'
import type { ImageUploadRequest, ImageMetadata } from '@/types'

export function useStorage() {
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const uploadedUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function uploadImage(params: ImageUploadRequest): Promise<string> {
    try {
      isUploading.value = true
      uploadProgress.value = 0
      error.value = null

      const response = await storageApi.uploadImage(params)

      uploadedUrl.value = response.imageUrl
      uploadProgress.value = 100

      return response.imageUrl
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
    return await storageApi.getImageUrl(imageId, expiry)
  }

  async function getImageMetadata(imageId: string): Promise<ImageMetadata> {
    return await storageApi.getImageMetadata(imageId)
  }

  async function deleteImage(imageId: string): Promise<void> {
    return await storageApi.deleteImage(imageId)
  }

  function reset() {
    uploadedUrl.value = null
    uploadProgress.value = 0
    error.value = null
  }

  return {
    isUploading: computed(() => isUploading.value),
    uploadProgress: computed(() => uploadProgress.value),
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
