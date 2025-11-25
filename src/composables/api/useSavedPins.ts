// src/composables/api/useSavedPins.ts
/**
 * useSavedPins - Управление сохраненными пинами
 */

import { computed, ref } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import type { PinWithBlob } from '@/types'

export function useSavedPins() {
  const pinsStore = usePinsStore()

  const error = ref<Error | null>(null)

  // Saved pins из saved feed
  const savedPins = computed<PinWithBlob[]>(() => {
    const feed = pinsStore.feeds.get('saved')
    return feed?.pins || []
  })

  const isLoading = computed(() => {
    const feed = pinsStore.feeds.get('saved')
    return feed?.isLoading || false
  })

  const hasMore = computed(() => {
    const feed = pinsStore.feeds.get('saved')
    return feed?.hasMore ?? true
  })

  async function fetch(page = 0) {
    try {
      error.value = null
      return await pinsStore.fetchPins({ scope: 'SAVED' }, page, 15, 'saved')
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function loadMore() {
    const feed = pinsStore.feeds.get('saved')
    if (!feed?.hasMore || feed.isLoading) return []

    return await fetch(feed.page + 1)
  }

  async function savePin(pinId: string) {
    try {
      error.value = null
      return await pinsStore.savePin(pinId)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function unsavePin(pinId: string) {
    try {
      error.value = null
      return await pinsStore.unsavePin(pinId)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  function reset() {
    pinsStore.resetFeed('saved')
  }

  return {
    savedPins,
    isLoading,
    hasMore,
    error,
    fetch,
    loadMore,
    savePin,
    unsavePin,
    reset,
  }
}
