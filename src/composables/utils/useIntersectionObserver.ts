// src/composables/utils/useIntersectionObserver.ts
/**
 * useIntersectionObserver
 *
 * ОТЛИЧИЕ ОТ v-intersect и v-lazy-load:
 * - Возвращает reactive isIntersecting
 * - Возвращает entry для доступа к ratio, bounds и т.д.
 * - Поддерживает once, stop(), программное управление
 *
 * Используйте v-intersect когда:
 * - Просто нужен callback при intersection
 * - Не нужен reactive state
 *
 * Используйте v-lazy-load когда:
 * - Ленивая загрузка изображений
 *
 * Используйте useIntersectionObserver когда:
 * - Нужен isIntersecting в template/script
 * - Нужен доступ к entry.intersectionRatio
 * - Нужен stop() для программного управления
 */

import { ref, watch, unref, onUnmounted, computed, type Ref } from 'vue'
import type { MaybeElementRef } from './useClickOutside'

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Callback при intersection */
  onIntersect?: (entry: IntersectionObserverEntry) => void
  /** Отключить после первого срабатывания */
  once?: boolean
  /** Автоматически наблюдать */
  immediate?: boolean
}

export function useIntersectionObserver(
  target: MaybeElementRef,
  options: UseIntersectionObserverOptions = {},
) {
  const { onIntersect, once = false, immediate = true, ...observerOptions } = options

  const isIntersecting = ref(false)
  const entry = ref<IntersectionObserverEntry | null>(null)

  // Computed для удобства
  const intersectionRatio = computed(() => entry.value?.intersectionRatio ?? 0)

  let observer: IntersectionObserver | undefined
  let isActive = false

  const cleanup = () => {
    observer?.disconnect()
    observer = undefined
    isActive = false
  }

  const observe = () => {
    cleanup()

    const element = unref(target)
    if (!element) return

    observer = new IntersectionObserver(([observerEntry]) => {
      if (!observerEntry) return

      entry.value = observerEntry
      isIntersecting.value = observerEntry.isIntersecting

      if (observerEntry.isIntersecting) {
        onIntersect?.(observerEntry)
        if (once) cleanup()
      }
    }, observerOptions)

    observer.observe(element)
    isActive = true
  }

  if (immediate) {
    watch(() => unref(target), observe, { immediate: true })
  }

  onUnmounted(cleanup)

  return {
    isIntersecting,
    entry,
    intersectionRatio,
    observe,
    stop: cleanup,
    isActive: () => isActive,
  }
}

/**
 * useInfiniteScroll - НЕТ аналога в directives
 *
 * Предоставляет isLoading state и программное управление
 */
export function useInfiniteScroll(
  target: MaybeElementRef,
  onLoadMore: () => void | Promise<void>,
  options: {
    distance?: number
    disabled?: Ref<boolean>
  } = {},
) {
  const { distance = 200, disabled = ref(false) } = options
  const isLoading = ref(false)

  const handleIntersect = async () => {
    if (unref(disabled) || isLoading.value) return

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
export function useElementVisibility(
  target: MaybeElementRef,
  options: IntersectionObserverInit = {},
) {
  const { isIntersecting } = useIntersectionObserver(target, {
    threshold: 0.1,
    ...options,
  })

  return isIntersecting
}
