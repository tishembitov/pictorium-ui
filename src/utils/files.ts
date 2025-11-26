import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_MEDIA_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from './constants'
import {
  isImage,
  isVideo,
  validateFileSize,
  validateImageDimensions,
  validateVideoDuration,
} from './media'

export interface FileValidationResult {
  valid: boolean
  errors: string[]
}

// Validate file type
export function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(file.type)
}

// Comprehensive media file validation (из старого кода)
export async function validateMediaFile(
  file: File,
  p0: { maxVideoDuration: any },
): Promise<FileValidationResult> {
  const errors: string[] = []

  // Check file type
  if (!ALLOWED_MEDIA_TYPES.includes(file.type as any)) {
    errors.push('Invalid file type. Allowed: .jpg, .jpeg, .gif, .webp, .png, .bmp, .mp4, .webm')
    return { valid: false, errors }
  }

  // Check image
  if (isImage(file)) {
    // Check size
    if (!validateFileSize(file, MAX_IMAGE_SIZE)) {
      errors.push(`Image must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`)
    }

    // Check dimensions
    const dimensionsResult = await validateImageDimensions(file)
    if (!dimensionsResult.valid && dimensionsResult.error) {
      errors.push(dimensionsResult.error)
    }
  }

  // Check video
  if (isVideo(file)) {
    // Check size
    if (!validateFileSize(file, MAX_VIDEO_SIZE)) {
      errors.push(`Video must be less than ${MAX_VIDEO_SIZE / 1024 / 1024}MB`)
    }

    // Check duration
    const durationResult = await validateVideoDuration(file)
    if (!durationResult.valid && durationResult.error) {
      errors.push(durationResult.error)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Quick validation (synchronous)
export function validateMediaFileSync(file: File): FileValidationResult {
  const errors: string[] = []

  // Check file type
  if (!ALLOWED_MEDIA_TYPES.includes(file.type as any)) {
    errors.push('Invalid file type')
    return { valid: false, errors }
  }

  // Check size
  if (isImage(file) && !validateFileSize(file, MAX_IMAGE_SIZE)) {
    errors.push('Image is too large')
  }

  if (isVideo(file) && !validateFileSize(file, MAX_VIDEO_SIZE)) {
    errors.push('Video is too large')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Convert File to Base64 (для preview)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

// Download file from URL
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url)
  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
