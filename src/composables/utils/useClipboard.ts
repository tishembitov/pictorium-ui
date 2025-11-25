// src/composables/utils/useClipboard.ts
/**
 * useClipboard - Clipboard с reactive state
 *
 * Расширяет copyToClipboard из utils/helpers.ts
 * НЕТ аналога в directives
 */

import { ref } from 'vue'
import { copyToClipboard } from '@/utils/helpers'

export function useClipboard(resetDelay = 2000) {
  const copied = ref(false)
  const error = ref<Error | null>(null)
  let timeout: ReturnType<typeof setTimeout> | undefined

  const copy = async (text: string) => {
    try {
      error.value = null
      const success = await copyToClipboard(text)

      if (success) {
        copied.value = true
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          copied.value = false
        }, resetDelay)
      } else {
        throw new Error('Copy failed')
      }

      return success
    } catch (err) {
      error.value = err as Error
      copied.value = false
      return false
    }
  }

  return { copied, error, copy }
}
