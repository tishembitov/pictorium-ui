// src/composables/features/useFileUpload.ts
/**
 * useFileUpload - File upload с preview и validation
 */

import { ref, computed, watch, onUnmounted, type Ref } from 'vue' // ✅ ИСПРАВЛЕНО: import в начале
import { useStorage, type UploadImageOptions } from '@/composables/api/useStorage'
import { validateMediaFile, type FileValidationResult } from '@/utils/files'
import { isImage, isVideo } from '@/utils/media'
import { useToast } from '@/composables/ui/useToast'

export interface UseFileUploadOptions {
  accept?: string
  maxSize?: number
  maxVideoDuration?: number
  autoUpload?: boolean
  category?: string
  generateThumbnail?: boolean
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    accept = 'image/*,video/*',
    autoUpload = false,
    category = 'pins',
    generateThumbnail = true,
    maxVideoDuration = 30,
    onSuccess,
    onError,
  } = options

  const storage = useStorage()
  const { error: showError } = useToast()

  // State
  const file = ref<File | null>(null)
  const preview = ref<string | null>(null)
  const validationError = ref<string | null>(null)
  const uploadError = ref<Error | null>(null) // ✅ ДОБАВЛЕНО: error state

  // Computed
  const hasFile = computed(() => file.value !== null)
  const isImageFile = computed(() => (file.value ? isImage(file.value) : false))
  const isVideoFile = computed(() => (file.value ? isVideo(file.value) : false))
  const fileName = computed(() => file.value?.name || null)
  const fileSize = computed(() => file.value?.size || 0)

  // Cleanup preview URL
  const cleanupPreview = () => {
    if (preview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(preview.value)
      preview.value = null
    }
  }

  // Create preview from file
  const createPreview = (selectedFile: File) => {
    cleanupPreview()

    if (isImage(selectedFile) || isVideo(selectedFile)) {
      preview.value = URL.createObjectURL(selectedFile)
    }
  }

  // Select file (from input or drag)
  const selectFile = async (fileOrEvent: File | Event): Promise<boolean> => {
    let selectedFile: File | null = null

    if (fileOrEvent instanceof Event) {
      const input = fileOrEvent.target as HTMLInputElement
      selectedFile = input.files?.[0] || null
      input.value = ''
    } else {
      selectedFile = fileOrEvent
    }

    if (!selectedFile) return false

    // Validate
    const validation = await validateMediaFile(selectedFile, {
      maxVideoDuration,
    })
    if (!validation.valid) {
      validationError.value = validation.errors[0] || 'Invalid file'
      showError(validationError.value)
      return false
    }

    // Set file and create preview
    file.value = selectedFile
    validationError.value = null
    uploadError.value = null
    createPreview(selectedFile)

    // Auto-upload if enabled
    if (autoUpload) {
      await upload()
    }

    return true
  }

  // Upload file
  const upload = async (uploadOptions?: Partial<UploadImageOptions>): Promise<string> => {
    if (!file.value) {
      throw new Error('No file selected')
    }

    try {
      uploadError.value = null

      const options: UploadImageOptions = {
        category,
        generateThumbnail,
        thumbnailWidth: 400,
        thumbnailHeight: 400,
        ...uploadOptions,
      }

      const response = await storage.uploadImage(file.value, options)
      const url = response.imageUrl
      onSuccess?.(url)
      return url
    } catch (err) {
      const error = err as Error
      uploadError.value = error
      onError?.(error)
      showError(error.message || 'Upload failed')
      throw err
    }
  }

  // Reset all state
  const reset = () => {
    cleanupPreview()
    file.value = null
    validationError.value = null
    uploadError.value = null
    storage.reset()
  }

  onUnmounted(cleanupPreview)

  return {
    // State
    file,
    preview,
    validationError,
    uploadError, // ✅ ДОБАВЛЕНО
    uploadedUrl: storage.uploadedUrl,
    uploadProgress: storage.uploadProgress,
    isUploading: storage.isUploading,

    // Computed
    hasFile,
    isImageFile,
    isVideoFile,
    fileName,
    fileSize,
    accept,

    // Actions
    selectFile,
    upload,
    reset,
  }
}

/**
 * useMediaUpload - Preset для изображений (переименовано для избежания конфликта)
 */
export function useMediaUpload(options: Omit<UseFileUploadOptions, 'accept'> = {}) {
  return useFileUpload({
    ...options,
    accept: 'image/jpeg,image/png,image/gif,image/webp',
  })
}

/**
 * useVideoUpload - Preset для видео
 */
export function useVideoUpload(options: Omit<UseFileUploadOptions, 'accept'> = {}) {
  return useFileUpload({
    ...options,
    accept: 'video/mp4,video/webm',
  })
}

/**
 * useDragAndDrop - Drag & Drop support
 */
export function useDragAndDrop(
  targetRef: Ref<HTMLElement | null>,
  options: {
    accept?: string
    multiple?: boolean
    onDrop?: (files: File[]) => void
    onError?: (error: string) => void
  } = {},
) {
  const { accept, multiple = false, onDrop, onError } = options

  const isDragging = ref(false)
  let dragCounter = 0

  const isAcceptedType = (file: File): boolean => {
    if (!accept) return true

    const types = accept.split(',').map((t) => t.trim())
    return types.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -2))
      }
      return file.type === type
    })
  }

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter++
    isDragging.value = true
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter--
    if (dragCounter === 0) {
      isDragging.value = false
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = false
    dragCounter = 0

    let files = Array.from(e.dataTransfer?.files || [])

    if (accept) {
      const rejected = files.filter((f) => !isAcceptedType(f))
      if (rejected.length > 0) {
        onError?.(`Invalid file type: ${rejected[0]?.name}`)
      }
      files = files.filter(isAcceptedType)
    }

    if (!multiple && files.length > 1) {
      files = files.slice(0, 1)
    }

    if (files.length > 0) {
      onDrop?.(files)
    }
  }

  watch(
    targetRef,
    (el, _, onCleanup) => {
      if (!el) return

      el.addEventListener('dragenter', handleDragEnter)
      el.addEventListener('dragleave', handleDragLeave)
      el.addEventListener('dragover', handleDragOver)
      el.addEventListener('drop', handleDrop)

      onCleanup(() => {
        el.removeEventListener('dragenter', handleDragEnter)
        el.removeEventListener('dragleave', handleDragLeave)
        el.removeEventListener('dragover', handleDragOver)
        el.removeEventListener('drop', handleDrop)
      })
    },
    { immediate: true },
  )

  return { isDragging }
}
