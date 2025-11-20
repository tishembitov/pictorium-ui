/**
 * useDateFormat Composable
 *
 * Date formatting utilities с dayjs
 */

import { computed, onUnmounted, ref, unref, watch, type MaybeRef } from 'vue'
import {
  formatRelativeTime,
  formatChatTime,
  formatFullDate,
  formatDateTime,
  formatShortDate,
  formatTime,
  formatDateSeparator,
  isNewDay,
  parseToLocal,
} from '@/utils/dates'

/**
 * useDateFormat
 *
 * Reactive date formatting
 *
 * @example
 * ```ts
 * const createdAt = ref('2024-01-15T10:30:00Z')
 *
 * const { relative, full, short } = useDateFormat(createdAt)
 *
 * console.log(relative.value) // "2 hours ago"
 * console.log(full.value)     // "January 15, 2024"
 * ```
 */
export function useDateFormat(timestamp: MaybeRef<string | Date | null | undefined>) {
  const relative = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatRelativeTime(ts) : ''
  })

  const full = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatFullDate(ts) : ''
  })

  const dateTime = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatDateTime(ts) : ''
  })

  const short = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatShortDate(ts) : ''
  })

  const time = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatTime(ts) : ''
  })

  const chat = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatChatTime(ts) : ''
  })

  const separator = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatDateSeparator(ts) : ''
  })

  return {
    relative,
    full,
    dateTime,
    short,
    time,
    chat,
    separator,
  }
}

/**
 * useRelativeTime
 *
 * Только relative time с auto-update
 *
 * @example
 * ```ts
 * const createdAt = ref('2024-01-15T10:30:00Z')
 * const relativeTime = useRelativeTime(createdAt, {
 *   updateInterval: 60000 // Update every minute
 * })
 * ```
 */
export function useRelativeTime(
  timestamp: MaybeRef<string | Date | null | undefined>,
  options: {
    updateInterval?: number
  } = {},
) {
  const { updateInterval = 0 } = options

  const formatted = ref('')

  const update = () => {
    const ts = unref(timestamp)
    formatted.value = ts ? formatRelativeTime(ts) : ''
  }

  // Initial update
  update()

  // Auto-update
  let interval: ReturnType<typeof setInterval> | undefined
  if (updateInterval > 0) {
    interval = setInterval(update, updateInterval)

    onUnmounted(() => {
      if (interval) clearInterval(interval)
    })
  }

  // Watch timestamp changes
  watch(() => unref(timestamp), update)

  return formatted
}

/**
 * useTimeAgo
 *
 * Alias для useRelativeTime
 */
export const useTimeAgo = useRelativeTime

/**
 * useDateSeparator
 *
 * Для группировки сообщений/комментариев по дням
 *
 * @example
 * ```ts
 * const { shouldShowSeparator, separatorText } = useDateSeparator(
 *   currentMessage.createdAt,
 *   previousMessage.createdAt
 * )
 *
 * <div v-if="shouldShowSeparator">{{ separatorText }}</div>
 * ```
 */
export function useDateSeparator(
  current: MaybeRef<string | Date | null | undefined>,
  previous: MaybeRef<string | Date | null | undefined>,
) {
  const shouldShowSeparator = computed(() => {
    const curr = unref(current)
    const prev = unref(previous)

    if (!curr || !prev) return true

    return isNewDay(curr, prev)
  })

  const separatorText = computed(() => {
    const curr = unref(current)
    return curr ? formatDateSeparator(curr) : ''
  })

  return {
    shouldShowSeparator,
    separatorText,
  }
}

/**
 * useChatTimestamp
 *
 * Специализированное форматирование для чатов
 *
 * @example
 * ```ts
 * const { displayTime, fullDateTime } = useChatTimestamp(message.createdAt)
 *
 * // displayTime: "14:30" или "Yesterday" или "Mon"
 * // fullDateTime: "Jan 15, 2024 · 14:30"
 * ```
 */
export function useChatTimestamp(timestamp: MaybeRef<string | Date | null | undefined>) {
  const displayTime = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatChatTime(ts) : ''
  })

  const fullDateTime = computed(() => {
    const ts = unref(timestamp)
    return ts ? formatDateTime(ts) : ''
  })

  return {
    displayTime,
    fullDateTime,
  }
}
