import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import 'dayjs/locale/en'

// Setup dayjs plugins
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isToday)
dayjs.extend(isYesterday)
dayjs.locale('en')

// Relative time (из старого кода комментариев)
// "just now" if < 30 min, otherwise "X hours ago"
export function formatRelativeTime(timestamp: string | Date): string {
  const now = dayjs()
  const time = dayjs.utc(timestamp).local()
  const diffMinutes = now.diff(time, 'minute')

  return diffMinutes < 30 ? 'just now' : time.fromNow()
}

// Chat/Message time (из старого кода MessagesView)
// "HH:mm" if today, "Yesterday" if yesterday, "MMM D" if > 7 days, "ddd" otherwise
export function formatChatTime(timestamp: string | Date): string {
  const date = dayjs.utc(timestamp).local()
  const now = dayjs()

  if (date.isToday()) {
    return date.format('HH:mm')
  }

  if (date.isYesterday()) {
    return 'Yesterday'
  }

  const daysDiff = now.diff(date.startOf('day'), 'days')

  if (daysDiff > 7) {
    return date.format('MMM D')
  }

  return date.format('ddd')
}

// Full date format
export function formatFullDate(timestamp: string | Date): string {
  return dayjs.utc(timestamp).local().format('MMMM D, YYYY')
}

// Date with time
export function formatDateTime(timestamp: string | Date): string {
  return dayjs.utc(timestamp).local().format('MMM D, YYYY · HH:mm')
}

// Short date (MMM D)
export function formatShortDate(timestamp: string | Date): string {
  return dayjs.utc(timestamp).local().format('MMM D')
}

// Time only (HH:mm)
export function formatTime(timestamp: string | Date): string {
  return dayjs.utc(timestamp).local().format('HH:mm')
}

// Date separator для чатов (из старого WebsocketChat)
export function formatDateSeparator(timestamp: string | Date): string {
  return dayjs.utc(timestamp).local().format('DD MMM')
}

// Check if new day (для группировки сообщений)
export function isNewDay(current: string | Date, previous: string | Date): boolean {
  const currentDate = dayjs.utc(current).local().format('YYYY-MM-DD')
  const previousDate = dayjs.utc(previous).local().format('YYYY-MM-DD')
  return currentDate !== previousDate
}

// Get UTC timestamp
export function getUTCTimestamp(): string {
  return dayjs.utc().toISOString()
}

// Parse ISO string to local
export function parseToLocal(timestamp: string): dayjs.Dayjs {
  return dayjs.utc(timestamp).local()
}
