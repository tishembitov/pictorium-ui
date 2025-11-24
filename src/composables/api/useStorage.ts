/**
 * useStorage Composable
 *
 * Composable для работы с Storage Service
 */

import { ref, computed } from 'vue'
import { storageApi } from '@/api/storage.api'
import { useApiCall } from '@/composables/core/useApiCall'
import type { ImageUploadRequest, ImageMetadata } from '@/types'

export interface UseStorageReturn {
  uploadedImageUrl: ReturnType<typeof computed<string | null>>
  uploadProgress: ReturnType<typeof computed<number>>
  isUploading: ReturnType<typeof computed<boolean>>

  uploadImage: (params: ImageUploadRequest) => Promise<string>
  downloadImage: (imageId: string) => Promise<Blob>
  getImageUrl: (imageId: string, expiry?: number) => Promise<string>
  getImageMetadata: (imageId: string) => Promise<ImageMetadata>
  listImages: (category?: string) => Promise<ImageMetadata[]>
  deleteImage: (imageId: string) => Promise<void>
}

export function useStorage(): UseStorageReturn {
  const uploadedImageUrl = ref<string | null>(null)
  const uploadProgress = ref(0)

  // Upload Image
  const { execute: uploadImage, isLoading: isUploading } = useApiCall(
    async (params: ImageUploadRequest) => {
      uploadProgress.value = 0

      const response = await storageApi.uploadImage(params)

      uploadedImageUrl.value = response.imageUrl
      uploadProgress.value = 100

      return response.imageUrl
    },
    {
      showSuccessToast: true,
      successMessage: 'Image uploaded!',
      showErrorToast: true,
      errorMessage: 'Failed to upload image',
    },
  )

  // Download Image
  const { execute: downloadImage } = useApiCall(
    (imageId: string) => storageApi.downloadImage(imageId),
    { showErrorToast: true, errorMessage: 'Failed to download image' },
  )

  // Get Image URL
  const { execute: getImageUrl } = useApiCall(
    (imageId: string, expiry?: number) => storageApi.getImageUrl(imageId, expiry),
    { showErrorToast: true, errorMessage: 'Failed to get image URL' },
  )

  // Get Image Metadata
  const { execute: getImageMetadata } = useApiCall(
    (imageId: string) => storageApi.getImageMetadata(imageId),
    { showErrorToast: true, errorMessage: 'Failed to get image metadata' },
  )

  // List Images
  const { execute: listImages } = useApiCall(
    (category?: string) => storageApi.listImages(category),
    { showErrorToast: true, errorMessage: 'Failed to list images' },
  )

  // Delete Image
  const { execute: deleteImage } = useApiCall(
    (imageId: string) => storageApi.deleteImage(imageId),
    {
      showSuccessToast: true,
      successMessage: 'Image deleted!',
      showErrorToast: true,
      errorMessage: 'Failed to delete image',
    },
  )

  return {
    uploadedImageUrl: computed(() => uploadedImageUrl.value),
    uploadProgress: computed(() => uploadProgress.value),
    isUploading: computed(() => isUploading.value),

    uploadImage: async (params) => (await uploadImage(params))!,
    downloadImage: async (imageId) => (await downloadImage(imageId))!,
    getImageUrl: async (imageId, expiry) => (await getImageUrl(imageId, expiry))!,
    getImageMetadata: async (imageId) => (await getImageMetadata(imageId))!,
    listImages: async (category) => (await listImages(category)) || [],
    deleteImage: async (imageId) => {
      await deleteImage(imageId)
    },
  }
}

/**
 * useImageUpload - Упрощенный composable для загрузки изображения
 */
export function useImageUpload(category = 'uploads') {
  const { uploadImage, isUploading, uploadedImageUrl, uploadProgress } = useStorage()

  const preview = ref<string | null>(null)
  const file = ref<File | null>(null)

  const selectFile = (selectedFile: File) => {
    file.value = selectedFile
    preview.value = URL.createObjectURL(selectedFile)
  }

  const upload = async (options?: Partial<ImageUploadRequest>) => {
    if (!file.value) {
      throw new Error('No file selected')
    }

    const imageUrl = await uploadImage({
      file: file.value,
      category,
      generateThumbnail: true,
      thumbnailWidth: 400,
      thumbnailHeight: 400,
      ...options,
    })

    return imageUrl
  }

  const reset = () => {
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
    }
    file.value = null
    preview.value = null
  }

  return {
    file: computed(() => file.value),
    preview: computed(() => preview.value),
    uploadedImageUrl,
    uploadProgress,
    isUploading,
    selectFile,
    upload,
    reset,
  }
}
