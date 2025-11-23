/**
 * useHover Composable
 *
 * Hover states management
 */

import { ref, type Ref } from 'vue'
import { useEventListener } from '@/composables'

export interface UseHoverOptions {
  /**
   * Delay before considering hovered (ms)
   * @default 0
   */
  enterDelay?: number

  /**
   * Delay before considering not hovered (ms)
   * @default 0
   */
  leaveDelay?: number

  /**
   * Callback при hover
   */
  onEnter?: () => void

  /**
   * Callback при leave
   */
  onLeave?: () => void
}

/**
 * useHover
 *
 * @example
 * ```ts
 * const elementRef = ref<HTMLElement>()
 *
 * const { isHovered } = useHover(elementRef, {
 *   enterDelay: 200,
 *   onEnter: () => console.log('Hovered!')
 * })
 * ```
 */
export function useHover(
  elementRef: Ref<HTMLElement | null | undefined>,
  options: UseHoverOptions = {},
) {
  const { enterDelay = 0, leaveDelay = 0, onEnter, onLeave } = options

  const isHovered = ref(false)
  let enterTimeout: ReturnType<typeof setTimeout> | undefined
  let leaveTimeout: ReturnType<typeof setTimeout> | undefined

  const handleMouseEnter = () => {
    if (leaveTimeout) {
      clearTimeout(leaveTimeout)
      leaveTimeout = undefined
    }

    if (enterDelay > 0) {
      enterTimeout = setTimeout(() => {
        isHovered.value = true
        onEnter?.()
      }, enterDelay)
    } else {
      isHovered.value = true
      onEnter?.()
    }
  }

  const handleMouseLeave = () => {
    if (enterTimeout) {
      clearTimeout(enterTimeout)
      enterTimeout = undefined
    }

    if (leaveDelay > 0) {
      leaveTimeout = setTimeout(() => {
        isHovered.value = false
        onLeave?.()
      }, leaveDelay)
    } else {
      isHovered.value = false
      onLeave?.()
    }
  }

  useEventListener(elementRef, 'mouseenter', handleMouseEnter)
  useEventListener(elementRef, 'mouseleave', handleMouseLeave)

  onUnmounted(() => {
    if (enterTimeout) clearTimeout(enterTimeout)
    if (leaveTimeout) clearTimeout(leaveTimeout)
  })

  return {
    isHovered,
  }
}

/**
 * usePinHover
 *
 * Специализированный hover для PinCard
 *
 * @example
 * ```ts
 * const { isHovered, showActions } = usePinHover(pinRef)
 * ```
 */
export function usePinHover(elementRef: Ref<HTMLElement | null | undefined>) {
  const { isHovered } = useHover(elementRef, {
    enterDelay: 100,
    leaveDelay: 200,
  })

  const showActions = computed(() => isHovered.value)
  const showOverlay = computed(() => isHovered.value)

  return {
    isHovered,
    showActions,
    showOverlay,
  }
}

/**
 * useHoverIntent
 *
 * Hover с проверкой намерения (движение мыши)
 *
 * @example
 * ```ts
 * const { isHovered } = useHoverIntent(elementRef, {
 *   sensitivity: 7,
 *   interval: 100
 * })
 * ```
 */
export function useHoverIntent(
  elementRef: Ref<HTMLElement | null | undefined>,
  options: {
    sensitivity?: number
    interval?: number
    onEnter?: () => void
    onLeave?: () => void
  } = {},
) {
  const { sensitivity = 7, interval = 100, onEnter, onLeave } = options

  const isHovered = ref(false)
  let x = 0
  let y = 0
  let pX = 0
  let pY = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const handleMouseMove = (event: MouseEvent) => {
    x = event.clientX
    y = event.clientY
  }

  const compare = () => {
    if (Math.abs(pX - x) + Math.abs(pY - y) < sensitivity) {
      isHovered.value = true
      onEnter?.()
    } else {
      pX = x
      pY = y
      timer = setTimeout(compare, interval)
    }
  }

  const handleMouseEnter = (event: MouseEvent) => {
    pX = event.clientX
    pY = event.clientY
    x = pX
    y = pY

    timer = setTimeout(compare, interval)
  }

  const handleMouseLeave = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }

    isHovered.value = false
    onLeave?.()
  }

  useEventListener(elementRef, 'mouseenter', handleMouseEnter)
  useEventListener(elementRef, 'mousemove', handleMouseMove)
  useEventListener(elementRef, 'mouseleave', handleMouseLeave)

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return {
    isHovered,
  }
}

/**
 * useFocus
 *
 * Focus state tracking
 *
 * @example
 * ```ts
 * const inputRef = ref<HTMLInputElement>()
 *
 * const { isFocused, focus, blur } = useFocus(inputRef)
 * ```
 */
export function useFocus(elementRef: Ref<HTMLElement | null | undefined>) {
  const isFocused = ref(false)

  const handleFocus = () => {
    isFocused.value = true
  }

  const handleBlur = () => {
    isFocused.value = false
  }

  useEventListener(elementRef, 'focus', handleFocus)
  useEventListener(elementRef, 'blur', handleBlur)

  const focus = () => {
    const element = unref(elementRef)
    element?.focus()
  }

  const blur = () => {
    const element = unref(elementRef)
    element?.blur()
  }

  return {
    isFocused,
    focus,
    blur,
  }
}

/**
 * useActive
 *
 * Active state (mousedown/mouseup)
 *
 * @example
 * ```ts
 * const buttonRef = ref<HTMLElement>()
 *
 * const { isActive } = useActive(buttonRef)
 * ```
 */
export function useActive(elementRef: Ref<HTMLElement | null | undefined>) {
  const isActive = ref(false)

  const handleMouseDown = () => {
    isActive.value = true
  }

  const handleMouseUp = () => {
    isActive.value = false
  }

  const handleMouseLeave = () => {
    isActive.value = false
  }

  useEventListener(elementRef, 'mousedown', handleMouseDown)
  useEventListener(elementRef, 'mouseup', handleMouseUp)
  useEventListener(elementRef, 'mouseleave', handleMouseLeave)

  return {
    isActive,
  }
}
