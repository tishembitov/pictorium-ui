/**
 * useFileValidation Composable
 *
 * Валидация файлов перед загрузкой
 */

import { ref, computed } from 'vue'
import { validateMediaFile, validateMediaFileSync, type FileValidationResult } from '@/utils/files'
import { isImage, isVideo, getImageDimensions, getVideoDimensions } from '@/utils/media'
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MIN_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
  MAX_VIDEO_DURATION,
} from '@/utils/constants'

export interface UseFileValidationOptions {
  allowedTypes?: string[]
  maxSize?: number
  minWidth?: number
  minHeight?: number
  maxDuration?: number
}

/**
 * useFileValidation
 *
 * @example
 * ```ts
 * const { validateFile, isValidating, errors } = useFileValidation({
 *   maxSize: 10 * 1024 * 1024,
 *   minWidth: 200,
 *   minHeight: 300
 * })
 *
 * const result = await validateFile(file)
 * if (!result.valid) {
 *   console.error(result.errors)
 * }
 * ```
 */
export function useFileValidation(options: UseFileValidationOptions = {}) {
  const {
    allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES],
    maxSize,
    minWidth = MIN_IMAGE_WIDTH,
    minHeight = MIN_IMAGE_HEIGHT,
    maxDuration = MAX_VIDEO_DURATION,
  } = options

  const isValidating = ref(false)
  const errors = ref<string[]>([])

  const validateFile = async (file: File): Promise<FileValidationResult> => {
    isValidating.value = true
    errors.value = []

    try {
      const validationErrors: string[] = []

      // Type validation
      if (!allowedTypes.includes(file.type)) {
        validationErrors.push(
          `Invalid file type. Allowed: ${allowedTypes.map((t) => t.split('/')[1]).join(', ')}`,
        )
      }

      // Size validation
      const maxFileSize = maxSize || (isImage(file) ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE)
      if (file.size > maxFileSize) {
        const sizeMB = (maxFileSize / 1024 / 1024).toFixed(0)
        validationErrors.push(`File must be less than ${sizeMB}MB`)
      }

      // Image validation
      if (isImage(file)) {
        try {
          const dimensions = await getImageDimensions(file)

          if (dimensions.width < minWidth || dimensions.height < minHeight) {
            validationErrors.push(`Image must be at least ${minWidth}x${minHeight}`)
          }
        } catch (error) {
          validationErrors.push('Failed to read image dimensions')
        }
      }

      // Video validation
      if (isVideo(file)) {
        try {
          const video = document.createElement('video')
          const url = URL.createObjectURL(file)

          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => {
              if (video.duration > maxDuration) {
                validationErrors.push(`Video must be ${maxDuration} seconds or less`)
              }
              URL.revokeObjectURL(url)
              resolve()
            }

            video.onerror = () => {
              URL.revokeObjectURL(url)
              reject(new Error('Failed to load video'))
            }

            video.src = url
          })
        } catch (error) {
          validationErrors.push('Failed to read video metadata')
        }
      }

      errors.value = validationErrors

      return {
        valid: validationErrors.length === 0,
        errors: validationErrors,
      }
    } finally {
      isValidating.value = false
    }
  }

  const validateFileSync = (file: File): FileValidationResult => {
    const validationErrors: string[] = []

    // Type validation
    if (!allowedTypes.includes(file.type)) {
      validationErrors.push('Invalid file type')
    }

    // Size validation
    const maxFileSize = maxSize || (isImage(file) ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE)
    if (file.size > maxFileSize) {
      validationErrors.push('File is too large')
    }

    return {
      valid: validationErrors.length === 0,
      errors: validationErrors,
    }
  }

  return {
    isValidating,
    errors,
    validateFile,
    validateFileSync,
  }
}

/**
 * useImageDimensions
 *
 * Получение размеров изображения
 *
 * @example
 * ```ts
 * const { dimensions, isLoading, load } = useImageDimensions()
 *
 * await load(file)
 * console.log(dimensions.value) // { width: 800, height: 600 }
 * ```
 */
export function useImageDimensions() {
  const dimensions = ref<{ width: number; height: number } | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const load = async (file: File) => {
    if (!isImage(file)) {
      error.value = new Error('File is not an image')
      return null
    }

    try {
      isLoading.value = true
      error.value = null

      const dims = await getImageDimensions(file)
      dimensions.value = dims

      return dims
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    dimensions.value = null
    error.value = null
  }

  return {
    dimensions,
    isLoading,
    error,
    load,
    reset,
  }
}

/**
 * useVideoDuration
 *
 * Получение длительности видео
 */
export function useVideoDuration() {
  const duration = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const load = async (file: File) => {
    if (!isVideo(file)) {
      error.value = new Error('File is not a video')
      return null
    }

    try {
      isLoading.value = true
      error.value = null

      const video = document.createElement('video')
      const url = URL.createObjectURL(file)

      const videoDuration = await new Promise<number>((resolve, reject) => {
        video.onloadedmetadata = () => {
          resolve(video.duration)
          URL.revokeObjectURL(url)
        }

        video.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load video'))
        }

        video.src = url
      })

      duration.value = videoDuration
      return videoDuration
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    duration.value = null
    error.value = null
  }

  return {
    duration,
    isLoading,
    error,
    load,
    reset,
  }
}
