/**
 * useKeyboardShortcuts Composable
 *
 * Регистрация keyboard shortcuts
 */

import { onMounted, onUnmounted, type Ref, unref } from 'vue'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: (event: KeyboardEvent) => void
}

/**
 * useKeyboardShortcuts
 *
 * @example
 * ```ts
 * useKeyboardShortcuts([
 *   {
 *     key: 's',
 *     ctrl: true,
 *     handler: (e) => {
 *       e.preventDefault()
 *       savePin()
 *     }
 *   },
 *   {
 *     key: 'k',
 *     ctrl: true,
 *     handler: () => openSearch()
 *   }
 * ])
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: {
    enabled?: Ref<boolean>
  } = {},
) {
  const { enabled = { value: true } } = options

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value) return

    shortcuts.forEach((shortcut) => {
      const { key, ctrl = false, shift = false, alt = false, meta = false, handler } = shortcut

      const matches =
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta

      if (matches) {
        handler(event)
      }
    })
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    stop: () => window.removeEventListener('keydown', handleKeyDown),
  }
}

/**
 * Предопределенные shortcuts
 */
export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true },
  SEARCH: { key: 'k', ctrl: true },
  NEW: { key: 'n', ctrl: true },
  CLOSE: { key: 'Escape' },
  HELP: { key: '?' },
  DELETE: { key: 'Delete' },
} as const
