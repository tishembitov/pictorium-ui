/**
 * useClickOutside Composable
 *
 * Detect clicks outside element
 */

import { onMounted, onUnmounted, ref, unref, watch, type Ref } from 'vue'

export type MaybeElementRef = Ref<HTMLElement | null | undefined> | HTMLElement | null | undefined

/**
 * useClickOutside
 *
 * @example
 * ```ts
 * const dropdownRef = ref<HTMLElement>()
 *
 * useClickOutside(dropdownRef, () => {
 *   console.log('Clicked outside dropdown')
 *   closeDropdown()
 * })
 * ```
 */
export function useClickOutside(
  target: MaybeElementRef,
  handler: (event: MouseEvent) => void,
  options: {
    ignore?: MaybeElementRef[]
    capture?: boolean
  } = {},
) {
  const { ignore = [], capture = true } = options

  const shouldIgnore = (event: MouseEvent): boolean => {
    return ignore.some((element) => {
      const el = unref(element)
      return el && (el === event.target || el.contains(event.target as Node))
    })
  }

  const listener = (event: MouseEvent) => {
    const el = unref(target)

    if (!el) return

    // Проверяем, что клик был вне элемента
    if (el === event.target || el.contains(event.target as Node)) {
      return
    }

    // Проверяем ignore list
    if (shouldIgnore(event)) {
      return
    }

    handler(event)
  }

  onMounted(() => {
    window.addEventListener('click', listener, capture)
  })

  onUnmounted(() => {
    window.removeEventListener('click', listener, capture)
  })

  return {
    stop: () => window.removeEventListener('click', listener, capture),
  }
}

/**
 * useClickAway
 *
 * Alias для useClickOutside
 */
export const useClickAway = useClickOutside

/**
 * useEscapeKey
 *
 * Detect Escape key press
 *
 * @example
 * ```ts
 * useEscapeKey(() => {
 *   closeModal()
 * })
 * ```
 */
export function useEscapeKey(handler: () => void) {
  const listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handler()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', listener)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', listener)
  })

  return {
    stop: () => window.removeEventListener('keydown', listener),
  }
}

/**
 * useFocusTrap
 *
 * Trap focus inside element (для модалок)
 *
 * @example
 * ```ts
 * const modalRef = ref<HTMLElement>()
 *
 * useFocusTrap(modalRef, {
 *   enabled: isModalOpen
 * })
 * ```
 */
export function useFocusTrap(
  target: MaybeElementRef,
  options: {
    enabled?: Ref<boolean>
    initialFocus?: MaybeElementRef
  } = {},
) {
  const { enabled = ref(true), initialFocus } = options

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
    )
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value || event.key !== 'Tab') return

    const container = unref(target)
    if (!container) return

    const focusableElements = getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Shift + Tab на первом элементе -> переход на последний
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    }
    // Tab на последнем элементе -> переход на первый
    else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }

  watch(enabled, (isEnabled) => {
    if (isEnabled) {
      const container = unref(target)
      const initial = unref(initialFocus)

      if (initial) {
        initial.focus()
      } else if (container) {
        const focusableElements = getFocusableElements(container)
        focusableElements[0]?.focus()
      }
    }
  })

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
