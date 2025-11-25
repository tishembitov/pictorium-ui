// src/composables/utils/useEventListener.ts
/**
 * useEventListener - Event listener с auto cleanup
 *
 * НЕТ аналога в directives - это низкоуровневый composable
 */

import { onMounted, onUnmounted, watch, unref, type Ref, ref } from 'vue'

type TargetRef = Ref<EventTarget | null | undefined> | EventTarget

// Overloads
export function useEventListener<K extends keyof WindowEventMap>(
  target: Window,
  event: K,
  handler: (evt: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): () => void

export function useEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  event: K,
  handler: (evt: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): () => void

export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: TargetRef,
  event: K,
  handler: (evt: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): () => void

export function useEventListener(
  target: any,
  event: string,
  handler: any,
  options?: any,
): () => void {
  let cleanup: (() => void) | undefined

  const register = () => {
    const el = unref(target)
    if (!el) return

    el.addEventListener(event, handler, options)
    cleanup = () => el.removeEventListener(event, handler, options)
  }

  const unregister = () => {
    cleanup?.()
    cleanup = undefined
  }

  if (typeof target === 'object' && target !== null && 'value' in target) {
    watch(
      () => unref(target),
      (newTarget) => {
        unregister()
        if (newTarget) register()
      },
      { immediate: true },
    )
  } else {
    onMounted(register)
  }

  onUnmounted(unregister)

  return unregister
}

/**
 * useWindowScroll - Reactive scroll position
 */
export function useWindowScroll() {
  const x = ref(window.scrollX)
  const y = ref(window.scrollY)

  useEventListener(
    window,
    'scroll',
    () => {
      x.value = window.scrollX
      y.value = window.scrollY
    },
    { passive: true },
  )

  return { x, y }
}

/**
 * useWindowSize - Reactive window size
 */
export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  useEventListener(
    window,
    'resize',
    () => {
      width.value = window.innerWidth
      height.value = window.innerHeight
    },
    { passive: true },
  )

  return { width, height }
}

/**
 * useMousePosition - Reactive mouse position
 */
export function useMousePosition() {
  const x = ref(0)
  const y = ref(0)

  useEventListener(
    window,
    'mousemove',
    (event) => {
      x.value = event.clientX
      y.value = event.clientY
    },
    { passive: true },
  )

  return { x, y }
}
