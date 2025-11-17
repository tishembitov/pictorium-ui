import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_MEDIA_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_VIDEO_DURATION,
  MIN_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
} from './constants'

export type MediaType = 'image' | 'video' | 'unknown'

// Check if file is image
export function isImage(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any)
}

// Check if file is video
export function isVideo(file: File): boolean {
  return ALLOWED_VIDEO_TYPES.includes(file.type as any)
}

// Check if file is GIF
export function isGif(file: File): boolean {
  return file.type === 'image/gif'
}

// Get media type
export function getMediaType(file: File): MediaType {
  if (isImage(file)) return 'image'
  if (isVideo(file)) return 'video'
  return 'unknown'
}

// Validate image dimensions (из старого CreatePinView)
export function validateImageDimensions(file: File): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      if (img.width < MIN_IMAGE_WIDTH || img.height < MIN_IMAGE_HEIGHT) {
        resolve({
          valid: false,
          error: `Image must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px`,
        })
      } else {
        resolve({ valid: true })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ valid: false, error: 'Failed to load image' })
    }

    img.src = url
  })
}

// Validate video duration (из старого CreatePinView)
export function validateVideoDuration(file: File): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
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
      resolve({ valid: false, error: 'Failed to load video' })
    }

    video.src = url
  })
}

// Get video duration
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to get video duration'))
    }

    video.src = url
  })
}

// Create object URL for preview
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

// Revoke object URL
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}

// Get image dimensions
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

// Calculate masonry height (из старого CreatePinView)
// Возвращает высоту для placeholder в масонке
export async function calculateMasonryHeight(
  file: File,
  containerWidth: number = 271.84, // default width из старого Pin.vue
): Promise<number> {
  const dimensions = await getImageDimensions(file)
  const aspectRatio = dimensions.height / dimensions.width
  return Math.round(containerWidth * aspectRatio)
}
