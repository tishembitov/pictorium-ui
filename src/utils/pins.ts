// src/utils/pins.ts
/**
 * Pin utilities - общие функции для работы с пинами
 */

import type { Pin, PinWithBlob } from '@/types'
import { storageApi } from '@/api'

/**
 * Загрузить blob URL для одного пина
 */
export async function loadPinBlob(pin: Pin): Promise<PinWithBlob> {
  if (!pin.imageId && !pin.videoPreviewId) return pin

  try {
    const pinWithBlob: PinWithBlob = { ...pin }

    const hasVideoPreview = !!pin.videoPreviewId
    pinWithBlob.isVideo = hasVideoPreview
    pinWithBlob.isGif = false
    pinWithBlob.isImage = !hasVideoPreview

    const promises: Promise<void>[] = []

    // Загружаем изображение (если не видео)
    if (pin.imageId && !hasVideoPreview) {
      promises.push(
        storageApi.downloadImage(pin.imageId).then((blob) => {
          pinWithBlob.imageBlobUrl = URL.createObjectURL(blob)
        }),
      )
    }

    // Загружаем превью видео
    if (pin.videoPreviewId) {
      promises.push(
        storageApi.downloadImage(pin.videoPreviewId).then((blob) => {
          pinWithBlob.videoBlobUrl = URL.createObjectURL(blob)
        }),
      )
    }

    await Promise.allSettled(promises)
    return pinWithBlob
  } catch (error) {
    console.error('[Pins] Failed to load pin blob:', error)
    return pin
  }
}

/**
 * Загрузить blob URLs для массива пинов
 */
export async function loadPinsBlobs(pins: Pin[]): Promise<PinWithBlob[]> {
  return Promise.all(pins.map(loadPinBlob))
}

