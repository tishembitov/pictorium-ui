// src/composables/features/useHover.ts
/**
 * useHover - Hover state management
 *
 * Уникальный composable с delay support
 */

import { ref, computed, unref, watch, onUnmounted, type Ref } from 'vue'
import { useEventListener } from '@/composables/utils/useEventListener'

export interface UseHoverOptions {
  enterDelay?: number
  leaveDelay?: number
  onEnter?: () => void
  onLeave?: () => void
}

export function useHover(elementRef: Ref<HTMLElement | null>, options: UseHoverOptions = {}) {
  const { enterDelay = 0, leaveDelay = 0, onEnter, onLeave } = options

  const isHovered = ref(false)
  let enterTimeout: ReturnType<typeof setTimeout> | undefined
  let leaveTimeout: ReturnType<typeof setTimeout> | undefined

  const handleEnter = () => {
    if (leaveTimeout) clearTimeout(leaveTimeout)

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

  const handleLeave = () => {
    if (enterTimeout) clearTimeout(enterTimeout)

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

  useEventListener(elementRef, 'mouseenter', handleEnter)
  useEventListener(elementRef, 'mouseleave', handleLeave)

  onUnmounted(() => {
    if (enterTimeout) clearTimeout(enterTimeout)
    if (leaveTimeout) clearTimeout(leaveTimeout)
  })

  return { isHovered }
}

/**
 * usePinHover - Специализированный hover для PinCard
 */
export function usePinHover(elementRef: Ref<HTMLElement | null>) {
  const { isHovered } = useHover(elementRef, {
    enterDelay: 100,
    leaveDelay: 200,
  })

  return {
    isHovered,
    showActions: computed(() => isHovered.value),
    showOverlay: computed(() => isHovered.value),
  }
}

/**
 * useFocus - Focus state tracking
 */
export function useFocus(elementRef: Ref<HTMLElement | null>) {
  const isFocused = ref(false)

  useEventListener(elementRef, 'focus', () => {
    isFocused.value = true
  })
  useEventListener(elementRef, 'blur', () => {
    isFocused.value = false
  })

  const focus = () => unref(elementRef)?.focus()
  const blur = () => unref(elementRef)?.blur()

  return { isFocused, focus, blur }
}
