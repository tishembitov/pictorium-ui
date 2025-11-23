import { MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT, MAX_VIDEO_DURATION } from './constants'

/**
 * Media utilities
 */

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
 * Получить превью видео
 */
export function getVideoThumbnail(file: File, seekTo = 0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      video.currentTime = seekTo
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create thumbnail'))
          }
          URL.revokeObjectURL(url)
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
  } catch (error) {
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
  try {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    const duration = await new Promise<number>((resolve, reject) => {
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

    if (duration > MAX_VIDEO_DURATION) {
      return {
        valid: false,
        error: `Video must be ${MAX_VIDEO_DURATION} seconds or less`,
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read video duration',
    }
  }
}
