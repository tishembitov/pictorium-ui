// src/composables/utils/useEventListener.ts
/**
 * useEventListener - Event listener с auto cleanup
 */

import { onMounted, onUnmounted, watch, unref, type Ref, ref } from 'vue'

type MaybeRef<T> = T | Ref<T>

export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | MaybeRef<HTMLElement | null>,
  event: K,
  handler: (evt: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): () => void

export function useEventListener(
  target: unknown,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions,
): () => void {
  let cleanup: (() => void) | undefined

  const register = (el: EventTarget) => {
    el.addEventListener(event, handler, options)
    cleanup = () => el.removeEventListener(event, handler, options)
  }

  const unregister = () => {
    cleanup?.()
    cleanup = undefined
  }

  // Ref target
  if (typeof target === 'object' && target !== null && 'value' in target) {
    watch(
      () => unref(target as Ref<HTMLElement | null>),
      (el, _, onCleanup) => {
        if (el) register(el)
        onCleanup(unregister)
      },
      { immediate: true },
    )
  } else {
    // Static target (window, document)
    onMounted(() => register(target as EventTarget))
    onUnmounted(unregister)
  }

  return unregister
}

/**
 * useWindowScroll - Reactive scroll position
 */
export function useWindowScroll() {
  const x = ref(0)
  const y = ref(0)

  if (typeof window !== 'undefined') {
    x.value = window.scrollX
    y.value = window.scrollY

    useEventListener(
      window,
      'scroll',
      () => {
        x.value = window.scrollX
        y.value = window.scrollY
      },
      { passive: true },
    )
  }

  return { x, y }
}

/**
 * useWindowSize - Reactive window size
 */
export function useWindowSize() {
  const width = ref(0)
  const height = ref(0)

  if (typeof window !== 'undefined') {
    width.value = window.innerWidth
    height.value = window.innerHeight

    useEventListener(
      window,
      'resize',
      () => {
        width.value = window.innerWidth
        height.value = window.innerHeight
      },
      { passive: true },
    )
  }

  return { width, height }
}

/**
 * useMousePosition - Reactive mouse position
 */
export function useMousePosition() {
  const x = ref(0)
  const y = ref(0)

  if (typeof window !== 'undefined') {
    useEventListener(
      window,
      'mousemove',
      (event) => {
        x.value = event.clientX
        y.value = event.clientY
      },
      { passive: true },
    )
  }

  return { x, y }
}
