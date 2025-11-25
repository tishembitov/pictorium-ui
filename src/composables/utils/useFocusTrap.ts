// src/composables/utils/useFocusTrap.ts
/**
 * useFocusTrap - Focus trap для модалок
 *
 * НЕТ аналога в directives - слишком сложная логика
 */

import { onMounted, onUnmounted, unref, watch, type Ref, ref } from 'vue'
import type { MaybeElementRef } from './useClickOutside'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface UseFocusTrapOptions {
  /** Включен ли trap */
  enabled?: Ref<boolean>
  /** Элемент для начального фокуса */
  initialFocus?: MaybeElementRef
  /** Вернуть фокус при отключении */
  returnFocusOnDeactivate?: boolean
}

export function useFocusTrap(target: MaybeElementRef, options: UseFocusTrapOptions = {}) {
  const { enabled = ref(true), initialFocus, returnFocusOnDeactivate = true } = options

  let previouslyFocused: HTMLElement | null = null

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
    )
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!unref(enabled) || event.key !== 'Tab') return

    const container = unref(target)
    if (!container) return

    const focusableElements = getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]!
    const lastElement = focusableElements[focusableElements.length - 1]!

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const activate = () => {
    previouslyFocused = document.activeElement as HTMLElement

    const container = unref(target)
    if (!container) return

    const initial = unref(initialFocus)
    if (initial) {
      initial.focus()
    } else {
      const focusableElements = getFocusableElements(container)
      focusableElements[0]?.focus()
    }
  }

  const deactivate = () => {
    if (returnFocusOnDeactivate && previouslyFocused) {
      previouslyFocused.focus()
      previouslyFocused = null
    }
  }

  watch(
    enabled,
    (isEnabled) => {
      if (isEnabled) {
        activate()
      } else {
        deactivate()
      }
    },
    { immediate: true },
  )

  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    deactivate()
  })

  return { activate, deactivate }
}
