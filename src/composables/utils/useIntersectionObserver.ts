/**
 * useIntersectionObserver Composable
 *
 * Intersection Observer API wrapper
 */

import { ref, watch, unref, onUnmounted, type Ref } from 'vue'
import type { MaybeElementRef } from './useClickOutside'

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * Вызывается при пересечении
   */
  onIntersect?: (entry: IntersectionObserverEntry) => void
}

/**
 * useIntersectionObserver
 *
 * @example
 * ```ts
 * const targetRef = ref<HTMLElement>()
 * const { isIntersecting, stop } = useIntersectionObserver(targetRef, {
 *   threshold: 0.5,
 *   onIntersect: (entry) => {
 *     console.log('Element is intersecting:', entry.isIntersecting)
 *   }
 * })
 * ```
 */
export function useIntersectionObserver(
  target: MaybeElementRef,
  options: UseIntersectionObserverOptions = {},
) {
  const { onIntersect, ...observerOptions } = options

  const isIntersecting = ref(false)
  const entry = ref<IntersectionObserverEntry | null>(null)

  let observer: IntersectionObserver | undefined

  const cleanup = () => {
    if (observer) {
      observer.disconnect()
      observer = undefined
    }
  }

  const observe = () => {
    cleanup()

    const element = unref(target)
    if (!element) return

    observer = new IntersectionObserver(([observerEntry]) => {
      if (!observerEntry) return

      entry.value = observerEntry
      isIntersecting.value = observerEntry.isIntersecting

      if (onIntersect && observerEntry.isIntersecting) {
        onIntersect(observerEntry)
      }
    }, observerOptions)

    observer.observe(element)
  }

  // Watch target changes
  watch(() => unref(target), observe, { immediate: true })

  onUnmounted(cleanup)

  return {
    isIntersecting,
    entry,
    stop: cleanup,
  }
}

/**
 * useInfiniteScroll
 *
 * Infinite scroll implementation
 *
 * @example
 * ```ts
 * const loadMoreRef = ref<HTMLElement>()
 *
 * useInfiniteScroll(loadMoreRef, () => {
 *   loadMorePins()
 * }, {
 *   distance: 200,
 *   disabled: computed(() => !hasMore.value || isLoading.value)
 * })
 * ```
 */
export function useInfiniteScroll(
  target: MaybeElementRef,
  onLoadMore: () => void | Promise<void>,
  options: {
    distance?: number
    disabled?: Ref<boolean>
    immediate?: boolean
  } = {},
) {
  const { distance = 200, disabled = ref(false), immediate = true } = options

  const isLoading = ref(false)

  const handleIntersect = async () => {
    if (disabled.value || isLoading.value) return

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

  if (!immediate) {
    stop()
    return {
      isLoading,
      isIntersecting,
      resume: () => {
        const element = unref(target)
        if (element) {
          useIntersectionObserver(target, options as UseIntersectionObserverOptions)
        }
      },
      stop,
    }
  }

  return {
    isLoading,
    isIntersecting,
    stop,
  }
}

/**
 * useLazyLoad
 *
 * Lazy load images
 *
 * @example
 * ```ts
 * const imageRef = ref<HTMLImageElement>()
 *
 * useLazyLoad(imageRef, {
 *   src: 'https://example.com/image.jpg',
 *   onLoad: () => console.log('Image loaded')
 * })
 * ```
 */
export function useLazyLoad(
  target: Ref<HTMLImageElement | null | undefined>,
  options: {
    src: string
    srcset?: string
    onLoad?: () => void
    onError?: () => void
    threshold?: number
  },
) {
  const { src, srcset, onLoad, onError, threshold = 0.1 } = options

  const isLoaded = ref(false)
  const hasError = ref(false)

  useIntersectionObserver(target, {
    threshold,
    onIntersect: () => {
      const img = unref(target)
      if (!img || isLoaded.value) return

      img.onload = () => {
        isLoaded.value = true
        onLoad?.()
      }

      img.onerror = () => {
        hasError.value = true
        onError?.()
      }

      img.src = src
      if (srcset) {
        img.srcset = srcset
      }
    },
  })

  return {
    isLoaded,
    hasError,
  }
}

/**
 * useElementVisibility
 *
 * Track element visibility
 *
 * @example
 * ```ts
 * const elementRef = ref<HTMLElement>()
 * const isVisible = useElementVisibility(elementRef)
 *
 * watch(isVisible, (visible) => {
 *   if (visible) {
 *     console.log('Element is visible')
 *   }
 * })
 * ```
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
