// src/composables/api/useCreatePin.ts
/**
 * useCreatePin - Создание пина с загрузкой файла
 */

import { ref, computed, onUnmounted } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import { useFileUpload } from '@/composables/features/useFileUpload'
import { extractDominantColorFromBlob } from '@/utils/colors'
import type { PinWithBlob } from '@/types'

export interface CreatePinData {
  title?: string
  description?: string
  href?: string
  tags?: string[]
}

export function useCreatePin() {
  const pinsStore = usePinsStore()

  const fileUpload = useFileUpload({
    accept: 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm',
    category: 'pins',
    generateThumbnail: true,
  })

  const isCreating = ref(false)
  const error = ref<Error | null>(null)
  const createdPin = ref<PinWithBlob | null>(null)

  // Dominant color extraction
  const dominantColor = ref<string | null>(null)

  async function extractColor() {
    if (!fileUpload.file.value) return null

    try {
      dominantColor.value = await extractDominantColorFromBlob(fileUpload.file.value)
      return dominantColor.value
    } catch (e) {
      console.warn('[useCreatePin] Failed to extract color:', e)
      return '#808080'
    }
  }

  async function create(data: CreatePinData): Promise<PinWithBlob> {
    if (!fileUpload.file.value) {
      throw new Error('No file selected')
    }

    try {
      isCreating.value = true
      error.value = null

      // Extract color if not already done
      const rgb = dominantColor.value || (await extractColor()) || '#808080'

      const pin = await pinsStore.createPin({
        file: fileUpload.file.value,
        title: data.title,
        description: data.description,
        href: data.href,
        tags: data.tags,
        rgb,
      })

      createdPin.value = pin
      return pin
    } catch (e) {
      error.value = e as Error
      throw e
    } finally {
      isCreating.value = false
    }
  }

  function reset() {
    fileUpload.reset()
    dominantColor.value = null
    createdPin.value = null
    error.value = null
  }

  onUnmounted(reset)

  return {
    // File upload
    file: fileUpload.file,
    preview: fileUpload.preview,
    isImageFile: fileUpload.isImageFile,
    isVideoFile: fileUpload.isVideoFile,
    validationError: fileUpload.validationError,
    selectFile: fileUpload.selectFile,

    // Create
    isCreating,
    error,
    createdPin,
    dominantColor,

    // Actions
    extractColor,
    create,
    reset,
  }
}
