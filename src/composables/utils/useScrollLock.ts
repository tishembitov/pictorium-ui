// src/composables/utils/useScrollLock.ts
/**
 * useScrollLock - Блокировка скролла body
 */

import { ref, watch, onUnmounted, type Ref } from 'vue'

export function useScrollLock(isLocked: Ref<boolean>) {
  const originalOverflow = ref<string>('')

  function lock() {
    if (typeof document === 'undefined') return
    originalOverflow.value = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  function unlock() {
    if (typeof document === 'undefined') return
    document.body.style.overflow = originalOverflow.value
  }

  watch(
    isLocked,
    (locked) => {
      if (locked) {
        lock()
      } else {
        unlock()
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    unlock()
  })

  return { lock, unlock }
}

/**
 * useBodyScrollLock - Простая версия без ref
 */
export function useBodyScrollLock() {
  let originalOverflow = ''

  function lock() {
    if (typeof document === 'undefined') return
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  function unlock() {
    if (typeof document === 'undefined') return
    document.body.style.overflow = originalOverflow
  }

  onUnmounted(unlock)

  return { lock, unlock }
}
