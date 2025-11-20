/**
 * useEventListener Composable
 *
 * Удобное добавление event listeners с auto cleanup
 */

import { onMounted, onUnmounted, watch, unref, type Ref, ref } from 'vue'

export type TargetRef = Ref<EventTarget | null | undefined> | EventTarget

/**
 * useEventListener
 *
 * @example
 * ```ts
 * // Window event
 * useEventListener('resize', () => {
 *   console.log('Window resized')
 * })
 *
 * // Element event
 * const buttonRef = ref<HTMLElement>()
 * useEventListener(buttonRef, 'click', () => {
 *   console.log('Button clicked')
 * })
 * ```
 */
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
  target: TargetRef | Window | Document,
  event: string,
  handler: (evt: Event) => void,
  options?: boolean | AddEventListenerOptions,
): () => void

export function useEventListener(
  target: unknown,
  event: string,
  handler: unknown,
  options?: unknown,
) {
  let cleanup: (() => void) | undefined

  const register = () => {
    const targetElement = unref(target)
    if (!targetElement) return

    ;(targetElement as EventTarget).addEventListener(
      event,
      handler as EventListener,
      options as AddEventListenerOptions,
    )

    cleanup = () => {
      ;(targetElement as EventTarget).removeEventListener(
        event,
        handler as EventListener,
        options as AddEventListenerOptions,
      )
    }
  }

  const unregister = () => {
    cleanup?.()
    cleanup = undefined
  }

  // Если target - это ref, watch за изменениями
  if (typeof target === 'object' && target !== null && 'value' in target) {
    watch(
      () => unref(target) as EventTarget | null | undefined,
      (newTarget) => {
        unregister()
        if (newTarget) register()
      },
      { immediate: true },
    )
  } else {
    // Иначе регистрируем сразу
    onMounted(register)
  }

  onUnmounted(unregister)

  return unregister
}

/**
 * useWindowScroll
 *
 * Reactive window scroll position
 *
 * @example
 * ```ts
 * const { x, y } = useWindowScroll()
 *
 * watch(y, (scrollY) => {
 *   console.log('Scroll Y:', scrollY)
 * })
 * ```
 */
export function useWindowScroll() {
  const x = ref(window.scrollX)
  const y = ref(window.scrollY)

  useEventListener(window, 'scroll', () => {
    x.value = window.scrollX
    y.value = window.scrollY
  })

  return { x, y }
}

/**
 * useWindowSize
 *
 * Reactive window size
 *
 * @example
 * ```ts
 * const { width, height } = useWindowSize()
 *
 * watch(width, (w) => {
 *   console.log('Window width:', w)
 * })
 * ```
 */
export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  useEventListener(window, 'resize', () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  })

  return { width, height }
}

/**
 * useMousePosition
 *
 * Reactive mouse position
 *
 * @example
 * ```ts
 * const { x, y } = useMousePosition()
 * ```
 */
export function useMousePosition(target: TargetRef = window) {
  const x = ref(0)
  const y = ref(0)

  useEventListener(target, 'mousemove', (event: MouseEvent) => {
    x.value = event.clientX
    y.value = event.clientY
  })

  return { x, y }
}

/**
 * useKeyPress
 *
 * Detect key press
 *
 * @example
 * ```ts
 * const isEscapePressed = useKeyPress('Escape')
 *
 * watch(isEscapePressed, (pressed) => {
 *   if (pressed) closeModal()
 * })
 * ```
 */
export function useKeyPress(targetKey: string | string[]) {
  const isPressed = ref(false)
  const keys = Array.isArray(targetKey) ? targetKey : [targetKey]

  const downHandler = (event: KeyboardEvent) => {
    if (keys.includes(event.key)) {
      isPressed.value = true
    }
  }

  const upHandler = (event: KeyboardEvent) => {
    if (keys.includes(event.key)) {
      isPressed.value = false
    }
  }

  useEventListener(window, 'keydown', downHandler)
  useEventListener(window, 'keyup', upHandler)

  return isPressed
}
