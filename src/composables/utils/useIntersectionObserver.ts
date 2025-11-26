// src/composables/utils/useIntersectionObserver.ts
/**
 * useIntersectionObserver
 *
 * ОТЛИЧИЕ ОТ v-intersect:
 * - Возвращает reactive isIntersecting
 * - Возвращает entry для доступа к ratio
 * - Поддерживает once, stop()
 */

import { ref, watch, unref, onUnmounted, computed, type Ref } from 'vue'
import type { MaybeElementRef } from './useClickOutside'

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Callback при intersection */
  onIntersect?: (entry: IntersectionObserverEntry) => void
  /** Отключить после первого срабатывания */
  once?: boolean
}

export function useIntersectionObserver(
  target: MaybeElementRef,
  options: UseIntersectionObserverOptions = {},
) {
  const { onIntersect, once = false, ...observerOptions } = options

  const isIntersecting = ref(false)
  const intersectionRatio = ref(0)

  let observer: IntersectionObserver | undefined

  const cleanup = () => {
    observer?.disconnect()
    observer = undefined
  }

  const observe = () => {
    cleanup()

    const element = unref(target)
    if (!element) return

    observer = new IntersectionObserver(([entry]) => {
      if (!entry) return

      isIntersecting.value = entry.isIntersecting
      intersectionRatio.value = entry.intersectionRatio

      if (entry.isIntersecting) {
        onIntersect?.(entry)
        if (once) cleanup()
      }
    }, observerOptions)

    observer.observe(element)
  }

  watch(() => unref(target), observe, { immediate: true })
  onUnmounted(cleanup)

  return {
    isIntersecting,
    intersectionRatio,
    observe,
    stop: cleanup,
  }
}

/**
 * useInfiniteScroll - Бесконечная прокрутка
 */
export function useInfiniteScroll<T = void>(
  target: MaybeElementRef,
  onLoadMore: () => T | Promise<T>,
  options: { distance?: number; disabled?: Ref<boolean> } = {},
) {
  const { distance = 200, disabled } = options
  const isLoading = ref(false)

  const handleIntersect = async () => {
    if ((disabled && unref(disabled)) || isLoading.value) return

    isLoading.value = true
    try {
      await onLoadMore()
    } finally {
      isLoading.value = false
    }
  }

  const { isIntersecting, stop } = useIntersectionObserver(target, {
    rootMargin: `${distance}px`,
    onIntersect: handleIntersect,
  })

  return { isLoading, isIntersecting, stop }
}

/**
 * useElementVisibility - Простая проверка видимости
 */
export function useElementVisibility(target: MaybeElementRef, threshold = 0.1) {
  const { isIntersecting } = useIntersectionObserver(target, { threshold })
  return isIntersecting
}
