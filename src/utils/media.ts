// src/utils/media.ts
import { MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT, MAX_VIDEO_DURATION } from './constants'

// ============================================================================
// FILE-BASED CHECKS
// ============================================================================

/**
 * Проверка, является ли файл видео
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/')
}

/**
 * Проверка, является ли файл изображением
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Проверка, является ли файл GIF
 */
export function isGif(file: File): boolean {
  return file.type === 'image/gif'
}

// ============================================================================
// URL-BASED CHECKS (NEW)
// ============================================================================

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv']
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']
const GIF_EXTENSION = 'gif'

/**
 * Получить расширение файла из URL или пути
 */
export function getFileExtension(url: string): string {
  if (!url) return ''
  // Убираем query params и hash
  const cleanUrl = url.split('?')[0]?.split('#')[0] || ''
  const match = cleanUrl.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

/**
 * Проверка, является ли URL видео (по расширению)
 */
export function isVideoUrl(url: string): boolean {
  const ext = getFileExtension(url)
  return VIDEO_EXTENSIONS.includes(ext)
}

/**
 * Проверка, является ли URL изображением (по расширению)
 */
export function isImageUrl(url: string): boolean {
  const ext = getFileExtension(url)
  return IMAGE_EXTENSIONS.includes(ext)
}

/**
 * Проверка, является ли URL GIF
 */
export function isGifUrl(url: string): boolean {
  return getFileExtension(url) === GIF_EXTENSION
}

/**
 * Универсальная проверка - принимает File или string
 */
export function isVideoMedia(media: File | string): boolean {
  if (typeof media === 'string') {
    return isVideoUrl(media)
  }
  return isVideo(media)
}

/**
 * Универсальная проверка - принимает File или string
 */
export function isImageMedia(media: File | string): boolean {
  if (typeof media === 'string') {
    return isImageUrl(media)
  }
  return isImage(media)
}

// ============================================================================
// DIMENSION HELPERS
// ============================================================================

/**
 * Получить размеры изображения
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error('File is not an image'))
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(url)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Получить размеры видео
 */
export function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!isVideo(file)) {
      reject(new Error('File is not a video'))
      return
    }

    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
      })
      URL.revokeObjectURL(url)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video'))
    }

    video.src = url
  })
}

/**
 * Проверить размер файла
 */
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

/**
 * Получить превью видео (thumbnail)
 */
export function getVideoThumbnail(file: File, seekTo = 0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekTo, video.duration)
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create thumbnail'))
          }
        },
        'image/jpeg',
        0.75,
      )
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video'))
    }

    video.src = url
  })
}

/**
 * Валидация размеров изображения
 */
export async function validateImageDimensions(
  file: File,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const dimensions = await getImageDimensions(file)

    if (dimensions.width < MIN_IMAGE_WIDTH || dimensions.height < MIN_IMAGE_HEIGHT) {
      return {
        valid: false,
        error: `Image must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}`,
      }
    }

    return { valid: true }
  } catch {
    return {
      valid: false,
      error: 'Failed to read image dimensions',
    }
  }
}

/**
 * Валидация длительности видео
 */
export async function validateVideoDuration(
  file: File,
): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)

      if (video.duration > MAX_VIDEO_DURATION) {
        resolve({
          valid: false,
          error: `Video must be ${MAX_VIDEO_DURATION} seconds or less`,
        })
      } else {
        resolve({ valid: true })
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({
        valid: false,
        error: 'Failed to read video duration',
      })
    }

    video.src = url
  })
}
