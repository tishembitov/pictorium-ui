// src/composables/features/useFileUpload.ts
/**
 * useFileUpload - File upload с preview и validation
 *
 * Расширяет useStorage из composables/api
 * Добавляет preview, drag & drop, validation
 */

import { ref, computed, watch, onUnmounted, type Ref } from 'vue'
import { useStorage } from '@/composables/api/useStorage'
import { validateMediaFile } from '@/utils/files'
import { isImage, isVideo } from '@/utils/media'
import { useToast } from '@/composables/ui/useToast'
import type { ImageUploadRequest } from '@/types'

export interface UseFileUploadOptions {
  accept?: string
  maxSize?: number
  autoUpload?: boolean
  category?: string
  generateThumbnail?: boolean
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    accept = 'image/*,video/*',
    maxSize,
    autoUpload = false,
    category = 'pins',
    generateThumbnail = true,
    onSuccess,
    onError,
  } = options

  const storage = useStorage()
  const { error: showError } = useToast()

  const file = ref<File | null>(null)
  const preview = ref<string | null>(null)
  const validationError = ref<string | null>(null)

  const hasFile = computed(() => file.value !== null)
  const isImageFile = computed(() => (file.value ? isImage(file.value) : false))
  const isVideoFile = computed(() => (file.value ? isVideo(file.value) : false))

  const selectFile = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const selectedFile = input.files?.[0]
    if (!selectedFile) return

    // Validate
    const validation = await validateMediaFile(selectedFile)
    if (!validation.valid) {
      validationError.value = validation.errors[0] || 'Invalid file'
      showError(validationError.value)
      return
    }

    file.value = selectedFile
    validationError.value = null

    // Create preview
    if (isImage(selectedFile)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        preview.value = e.target?.result as string
      }
      reader.readAsDataURL(selectedFile)
    } else if (isVideo(selectedFile)) {
      preview.value = URL.createObjectURL(selectedFile)
    }

    if (autoUpload) {
      await upload()
    }
  }

  const upload = async () => {
    if (!file.value) {
      throw new Error('No file selected')
    }

    try {
      const params: ImageUploadRequest = {
        file: file.value,
        category,
        generateThumbnail,
        thumbnailWidth: 400,
        thumbnailHeight: 400,
      }

      const url = await storage.uploadImage(params)
      onSuccess?.(url)
      return url
    } catch (err) {
      onError?.(err as Error)
      throw err
    }
  }

  const reset = () => {
    if (preview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(preview.value)
    }
    file.value = null
    preview.value = null
    validationError.value = null
    storage.reset()
  }

  onUnmounted(() => {
    if (preview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(preview.value)
    }
  })

  return {
    // State
    file,
    preview,
    validationError,
    uploadedUrl: storage.uploadedUrl,
    uploadProgress: storage.uploadProgress,
    isUploading: storage.isUploading,

    // Computed
    hasFile,
    isImageFile,
    isVideoFile,
    accept,

    // Actions
    selectFile,
    upload,
    reset,
  }
}

/**
 * useImageUpload - Preset для изображений
 */
export function useImageUpload(options: Omit<UseFileUploadOptions, 'accept'> = {}) {
  return useFileUpload({
    ...options,
    accept: 'image/jpeg,image/png,image/gif,image/webp',
  })
}

/**
 * useVideoUpload - Preset для видео
 */
export function useVideoUpload(options: Omit<UseFileUploadOptions, 'accept' | 'maxSize'> = {}) {
  return useFileUpload({
    ...options,
    accept: 'video/mp4,video/webm',
    maxSize: 50 * 1024 * 1024,
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
  } = {},
) {
  const { accept, multiple = false, onDrop } = options

  const isDragging = ref(false)
  let dragCounter = 0

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragCounter++
    isDragging.value = true
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragCounter--
    if (dragCounter === 0) isDragging.value = false
  }

  const handleDragOver = (e: DragEvent) => e.preventDefault()

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    dragCounter = 0

    let files = Array.from(e.dataTransfer?.files || [])
    if (!multiple) files = files.slice(0, 1)

    if (accept) {
      const types = accept.split(',').map((t) => t.trim())
      files = files.filter((f) =>
        types.some((type) =>
          type.endsWith('/*') ? f.type.startsWith(type.slice(0, -2)) : f.type === type,
        ),
      )
    }

    onDrop?.(files)
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
