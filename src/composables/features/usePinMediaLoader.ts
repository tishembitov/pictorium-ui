// src/composables/usePinMediaLoader.ts
import type { PinResponse, PinWithBlob } from '@/types'
import { storageApi } from '@/api/storage.api'

export function usePinMediaLoader() {
  /**
   * Загрузка blob URL для одного пина
   */
  async function loadPinBlob(pin: PinResponse): Promise<PinWithBlob> {
    const pinWithBlob: PinWithBlob = { ...pin }

    try {
      if (pin.imageUrl) {
        const blob = await storageApi.downloadImage(pin.imageUrl)
        const contentType = blob.type

        pinWithBlob.imageBlobUrl = URL.createObjectURL(blob)
        pinWithBlob.isImage = true
        pinWithBlob.isGif = contentType === 'image/gif'
      } else if (pin.videoPreviewUrl) {
        const blob = await storageApi.downloadImage(pin.videoPreviewUrl)
        pinWithBlob.videoBlobUrl = URL.createObjectURL(blob)
        pinWithBlob.isVideo = true
      }
    } catch (error) {
      console.error(`[MediaLoader] Failed to load media for pin ${pin.id}:`, error)
    }

    return pinWithBlob
  }

  /**
   * Загрузка blob URLs для массива пинов (параллельно)
   */
  async function loadPinsBlobs(pins: PinResponse[]): Promise<PinWithBlob[]> {
    return Promise.all(pins.map(loadPinBlob))
  }

  /**
   * Очистка blob URLs
   */
  function cleanupPinBlobs(pin: PinWithBlob) {
    if (pin.imageBlobUrl) {
      URL.revokeObjectURL(pin.imageBlobUrl)
    }
    if (pin.videoBlobUrl) {
      URL.revokeObjectURL(pin.videoBlobUrl)
    }
  }

  return {
    loadPinBlob,
    loadPinsBlobs,
    cleanupPinBlobs,
  }
}
