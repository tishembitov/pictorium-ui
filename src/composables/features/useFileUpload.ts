/**
 * useFileUpload Composable
 *
 * Загрузка файлов с preview и validation
 */

import { ref, computed, type Ref } from 'vue'
import { storageApi } from '@/api/storage.api'
import { useFileValidation } from './useFileValidation'
import { useProgress, useToast } from '@/composables'
import type { ImageUploadRequest } from '@/types'

export interface UseFileUploadOptions {
  /**
   * Разрешенные типы файлов
   */
  accept?: string

  /**
   * Максимальный размер (bytes)
   */
  maxSize?: number

  /**
   * Автоматическая загрузка после выбора
   */
  autoUpload?: boolean

  /**
   * Категория для Storage Service
   */
  category?: string

  /**
   * Генерировать thumbnail
   */
  generateThumbnail?: boolean

  /**
   * Callback при успехе
   */
  onSuccess?: (response: unknown) => void

  /**
   * Callback при ошибке
   */
  onError?: (error: Error) => void
}

/**
 * useFileUpload
 *
 * @example
 * ```ts
 * const {
 *   file,
 *   preview,
 *   selectFile,
 *   upload,
 *   reset
 * } = useFileUpload({
 *   accept: 'image/*',
 *   maxSize: 10 * 1024 * 1024,
 *   onSuccess: (response) => console.log('Uploaded:', response)
 * })
 *
 * <input
 *   type="file"
 *   @change="selectFile"
 *   :accept="accept"
 * />
 * ```
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    accept = 'image/*,video/*',
    maxSize = 10 * 1024 * 1024,
    autoUpload = false,
    category = 'pins',
    generateThumbnail = true,
    onSuccess,
    onError,
  } = options

  const { validateFile } = useFileValidation({ maxSize })
  const { progress, setProgress, reset: resetProgress } = useProgress()
  const { showToast } = useToast()

  const file = ref<File | null>(null)
  const preview = ref<string | null>(null)
  const isUploading = ref(false)
  const uploadedUrl = ref<string | null>(null)
  const error = ref<Error | null>(null)

  const hasFile = computed(() => file.value !== null)
  const isImage = computed(() => file.value?.type.startsWith('image/') || false)
  const isVideo = computed(() => file.value?.type.startsWith('video/') || false)

  const selectFile = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const selectedFile = target.files?.[0]

    if (!selectedFile) return

    // Validate
    const validation = await validateFile(selectedFile)
    if (!validation.valid) {
      error.value = new Error(validation.errors[0])
      showToast(validation.errors[0], 'error')
      return
    }

    file.value = selectedFile
    error.value = null

    // Create preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        preview.value = e.target?.result as string
      }
      reader.readAsDataURL(selectedFile)
    } else if (selectedFile.type.startsWith('video/')) {
      preview.value = URL.createObjectURL(selectedFile)
    }

    // Auto upload
    if (autoUpload) {
      await upload()
    }
  }

  const upload = async () => {
    if (!file.value) {
      error.value = new Error('No file selected')
      return null
    }

    try {
      isUploading.value = true
      error.value = null
      resetProgress()

      const uploadParams: ImageUploadRequest = {
        file: file.value,
        category,
        generateThumbnail,
      }

      if (isImage.value) {
        uploadParams.thumbnailWidth = 400
        uploadParams.thumbnailHeight = 400
      }

      // Simulate progress (в реальности нужен axios onUploadProgress)
      const progressInterval = setInterval(() => {
        setProgress(progress.value + 10)
      }, 200)

      const response = await storageApi.uploadImage(uploadParams)

      clearInterval(progressInterval)
      setProgress(100)

      uploadedUrl.value = response.imageUrl

      onSuccess?.(response)
      showToast('File uploaded successfully!', 'success')

      return response
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
      showToast('Failed to upload file', 'error')
      throw err
    } finally {
      isUploading.value = false
    }
  }

  const reset = () => {
    file.value = null
    preview.value = null
    uploadedUrl.value = null
    error.value = null
    resetProgress()
  }

  const removeFile = () => {
    if (preview.value && preview.value.startsWith('blob:')) {
      URL.revokeObjectURL(preview.value)
    }
    reset()
  }

  return {
    file,
    preview,
    uploadedUrl,
    isUploading,
    progress,
    error,
    hasFile,
    isImage,
    isVideo,
    accept,
    selectFile,
    upload,
    reset,
    removeFile,
  }
}

/**
 * useImageUpload
 *
 * Специализированная загрузка изображений
 *
 * @example
 * ```ts
 * const { selectImage, uploadImage } = useImageUpload({
 *   category: 'avatars',
 *   onSuccess: (url) => updateAvatar(url)
 * })
 * ```
 */
export function useImageUpload(options: Omit<UseFileUploadOptions, 'accept'> = {}) {
  return useFileUpload({
    ...options,
    accept: 'image/jpeg,image/jpg,image/gif,image/webp,image/png,image/bmp',
  })
}

/**
 * useVideoUpload
 *
 * Специализированная загрузка видео
 */
export function useVideoUpload(options: Omit<UseFileUploadOptions, 'accept'> = {}) {
  return useFileUpload({
    ...options,
    accept: 'video/mp4,video/webm',
    maxSize: 50 * 1024 * 1024, // 50MB
  })
}

/**
 * useDragAndDrop
 *
 * Drag & Drop для файлов
 *
 * @example
 * ```ts
 * const dropzoneRef = ref<HTMLElement>()
 *
 * const { isDragging, handleDrop } = useDragAndDrop(dropzoneRef, {
 *   onDrop: (files) => console.log('Dropped:', files)
 * })
 * ```
 */
export function useDragAndDrop(
  target: Ref<HTMLElement | null | undefined>,
  options: {
    accept?: string
    multiple?: boolean
    onDrop?: (files: File[]) => void
  } = {},
) {
  const { accept, multiple = false, onDrop } = options

  const isDragging = ref(false)
  const dragCounter = ref(0)

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragCounter.value++
    isDragging.value = true
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    dragCounter.value = 0

    const files = Array.from(e.dataTransfer?.files || [])

    if (!multiple && files.length > 1) {
      files.splice(1)
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim())
      const filteredFiles = files.filter((file) =>
        acceptedTypes.some((type) => {
          if (type.endsWith('/*')) {
            const prefix = type.slice(0, -2)
            return file.type.startsWith(prefix)
          }
          return file.type === type
        }),
      )
      onDrop?.(filteredFiles)
    } else {
      onDrop?.(files)
    }
  }

  watch(
    target,
    (el) => {
      if (!el) return

      el.addEventListener('dragenter', handleDragEnter)
      el.addEventListener('dragleave', handleDragLeave)
      el.addEventListener('dragover', handleDragOver)
      el.addEventListener('drop', handleDrop)

      return () => {
        el.removeEventListener('dragenter', handleDragEnter)
        el.removeEventListener('dragleave', handleDragLeave)
        el.removeEventListener('dragover', handleDragOver)
        el.removeEventListener('drop', handleDrop)
      }
    },
    { immediate: true },
  )

  return {
    isDragging,
    handleDrop,
  }
}
