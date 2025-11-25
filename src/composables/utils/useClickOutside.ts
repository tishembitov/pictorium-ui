// src/composables/utils/useClickOutside.ts
/**
 * useClickOutside
 *
 * ОТЛИЧИЕ ОТ v-click-outside:
 * - Возвращает { stop } для программного управления
 * - Поддерживает ignore list как refs
 * - Можно использовать в setup без template
 *
 * Используйте v-click-outside когда:
 * - Простой dropdown/modal
 * - Не нужно программно останавливать
 *
 * Используйте useClickOutside когда:
 * - Нужен stop() для условного отключения
 * - Ignore элементы динамические (refs)
 * - Используется в composable без template
 */

import { onMounted, onUnmounted, unref, watch, type Ref } from 'vue'

export type MaybeElementRef = Ref<HTMLElement | null | undefined> | HTMLElement | null | undefined

export interface UseClickOutsideOptions {
  /** Элементы для игнорирования (поддерживает refs) */
  ignore?: MaybeElementRef[]
  /** Capture phase */
  capture?: boolean
  /** Автоматически активировать */
  immediate?: boolean
}

export function useClickOutside(
  target: MaybeElementRef,
  handler: (event: MouseEvent) => void,
  options: UseClickOutsideOptions = {},
) {
  const { ignore = [], capture = true, immediate = true } = options

  let isActive = false
  let cleanup: (() => void) | undefined

  const shouldIgnore = (event: MouseEvent): boolean => {
    return ignore.some((element) => {
      const el = unref(element)
      return el && (el === event.target || el.contains(event.target as Node))
    })
  }

  const listener = (event: MouseEvent) => {
    if (!isActive) return

    const el = unref(target)
    if (!el) return

    if (el === event.target || el.contains(event.target as Node)) return
    if (shouldIgnore(event)) return

    handler(event)
  }

  const start = () => {
    if (isActive) return

    // Задержка чтобы избежать срабатывания на клик открытия
    setTimeout(() => {
      window.addEventListener('click', listener, capture)
      isActive = true
    }, 0)
  }

  const stop = () => {
    window.removeEventListener('click', listener, capture)
    isActive = false
  }

  // Watch target changes
  watch(
    () => unref(target),
    (newTarget) => {
      if (newTarget && immediate) {
        start()
      } else {
        stop()
      }
    },
    { immediate },
  )

  onUnmounted(stop)

  return { start, stop, isActive: () => isActive }
}

/**
 * useEscapeKey - НЕТ аналога в directives
 */
export function useEscapeKey(handler: () => void, options: { enabled?: Ref<boolean> } = {}) {
  const { enabled = { value: true } } = options

  const listener = (event: KeyboardEvent) => {
    if (unref(enabled) && event.key === 'Escape') {
      handler()
    }
  }

  onMounted(() => window.addEventListener('keydown', listener))
  onUnmounted(() => window.removeEventListener('keydown', listener))

  return { stop: () => window.removeEventListener('keydown', listener) }
}
