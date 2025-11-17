// File size formatter (из старого кода - был в ImageUploadResponse)
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Number formatter (для likes, followers, etc.)
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  return `${(num / 1000000).toFixed(1)}M`
}

// Compact number formatter
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num)
}

// Duration formatter (MM:SS) - из старого кода VideoPlayer
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Time remaining formatter (M:SS)
export function formatTimeRemaining(current: number, total: number): string {
  const remaining = Math.max(total - current, 0)
  const minutes = Math.floor(remaining / 60)
  const seconds = Math.floor(remaining % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// Username formatter (@username)
export function formatUsername(username: string, withAt: boolean = true): string {
  return withAt ? `@${username}` : username
}

// Percentage formatter
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}
