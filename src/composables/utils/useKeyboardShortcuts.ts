// src/composables/utils/useKeyboardShortcuts.ts
/**
 * useKeyboardShortcuts - Keyboard shortcuts
 *
 * НЕТ аналога в directives - сложная логика с modifiers
 */

import { onMounted, onUnmounted, unref, type Ref, ref } from 'vue'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: (event: KeyboardEvent) => void
  /** Предотвращать default action */
  preventDefault?: boolean
}

export interface UseKeyboardShortcutsOptions {
  /** Включены ли shortcuts */
  enabled?: Ref<boolean>
  /** Target element (default: window) */
  target?: Window | Document | HTMLElement
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {},
) {
  const { enabled = ref(true), target = window } = options

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!unref(enabled)) return

    // Игнорируем если фокус в input/textarea
    const activeElement = document.activeElement
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      // Разрешаем Escape
      if (event.key !== 'Escape') return
    }

    for (const shortcut of shortcuts) {
      const {
        key,
        ctrl = false,
        shift = false,
        alt = false,
        meta = false,
        handler,
        preventDefault = true,
      } = shortcut

      const matches =
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta

      if (matches) {
        if (preventDefault) event.preventDefault()
        handler(event)
        break
      }
    }
  }

  onMounted(() => target.addEventListener('keydown', handleKeyDown as EventListener))
  onUnmounted(() => target.removeEventListener('keydown', handleKeyDown as EventListener))

  return { stop: () => target.removeEventListener('keydown', handleKeyDown as EventListener) }
}

/** Предопределенные shortcuts */
export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true },
  SEARCH: { key: 'k', ctrl: true },
  NEW: { key: 'n', ctrl: true },
  CLOSE: { key: 'Escape' },
  HELP: { key: '?' },
  DELETE: { key: 'Delete' },
  UNDO: { key: 'z', ctrl: true },
  REDO: { key: 'z', ctrl: true, shift: true },
} as const
