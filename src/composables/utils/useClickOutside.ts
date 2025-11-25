// src/composables/utils/useClickOutside.ts
/**
 * useClickOutside
 *
 * ОТЛИЧИЕ ОТ v-click-outside:
 * - Возвращает { stop } для программного управления
 * - Поддерживает ignore list как refs
 * - Можно использовать в setup без template
 */

import { onUnmounted, unref, watch, type Ref } from 'vue'

export type MaybeElementRef = Ref<HTMLElement | null | undefined> | HTMLElement | null | undefined

export interface UseClickOutsideOptions {
  /** Элементы для игнорирования */
  ignore?: MaybeElementRef[]
  /** Capture phase */
  capture?: boolean
}

export function useClickOutside(
  target: MaybeElementRef,
  handler: (event: MouseEvent) => void,
  options: UseClickOutsideOptions = {},
) {
  const { ignore = [], capture = true } = options

  let isActive = false

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

  // Автостарт при наличии target
  watch(
    () => unref(target),
    (newTarget) => {
      if (newTarget) {
        start()
      } else {
        stop()
      }
    },
    { immediate: true },
  )

  onUnmounted(stop)

  return { start, stop, isActive: () => isActive }
}

/**
 * useEscapeKey - Закрытие по Escape
 */
export function useEscapeKey(handler: () => void, options: { enabled?: Ref<boolean> } = {}) {
  const { enabled } = options

  const listener = (event: KeyboardEvent) => {
    const isEnabled = enabled ? unref(enabled) : true
    if (isEnabled && event.key === 'Escape') {
      handler()
    }
  }

  window.addEventListener('keydown', listener)
  onUnmounted(() => window.removeEventListener('keydown', listener))

  return { stop: () => window.removeEventListener('keydown', listener) }
}
