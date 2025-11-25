// src/utils/helpers.ts

// ============================================================================
// ASYNC HELPERS
// ============================================================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delayMs?: number
    backoff?: number
  } = {},
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = 2 } = options

  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts - 1) {
        await sleep(delayMs * Math.pow(backoff, attempt))
      }
    }
  }

  throw lastError
}

// ============================================================================
// OBJECT HELPERS
// ============================================================================

export function deepClone<T>(obj: T): T {
  return structuredClone(obj)
}

export function isEmpty(obj: unknown): boolean {
  if (obj == null) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result as Omit<T, K>
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

// ============================================================================
// ARRAY HELPERS
// ============================================================================

export function removeDuplicates<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (result, item) => {
      const groupKey = String(item[key])
      result[groupKey] ??= []
      result[groupKey].push(item)
      return result
    },
    {} as Record<string, T[]>,
  )
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export function randomItem<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

// ============================================================================
// NUMBER HELPERS
// ============================================================================

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ============================================================================
// STRING/ID HELPERS
// ============================================================================

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// BROWSER HELPERS
// ============================================================================

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

export function downloadJSON(data: unknown, filename: string = 'data.json'): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getBaseURL(): string {
  if (!isBrowser()) return ''
  return window.location.origin
}

// ============================================================================
// URL HELPERS
// ============================================================================

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value))
    }
  })
  return searchParams.toString()
}

// ============================================================================
// THROTTLE & DEBOUNCE
// ============================================================================

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ✅ ИСПРАВЛЕНО: debounce с поддержкой cancel и flush
export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = options

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  let lastThis: unknown
  let lastCallTime: number | undefined
  let lastInvokeTime = 0
  let result: ReturnType<T> | undefined

  function invokeFunc(time: number): ReturnType<T> | undefined {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = undefined
    lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args) as ReturnType<T>
    return result
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = lastCallTime === undefined ? 0 : time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= delay
    )
  }

  function trailingEdge(time: number): ReturnType<T> | undefined {
    timeoutId = undefined

    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = undefined
    lastThis = undefined
    return result
  }

  function timerExpired(): void {
    const time = Date.now()
    if (shouldInvoke(time)) {
      trailingEdge(time)
      return
    }

    const timeSinceLastCall = lastCallTime ? time - lastCallTime : 0
    const remaining = delay - timeSinceLastCall
    timeoutId = setTimeout(timerExpired, remaining)
  }

  function leadingEdge(time: number): ReturnType<T> | undefined {
    lastInvokeTime = time
    timeoutId = setTimeout(timerExpired, delay)
    return leading ? invokeFunc(time) : result
  }

  function debounced(this: unknown, ...args: Parameters<T>): void {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === undefined) {
        leadingEdge(time)
        return
      }
    }

    timeoutId ??= setTimeout(timerExpired, delay)
  }

  debounced.cancel = function (): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    lastInvokeTime = 0
    lastArgs = undefined
    lastCallTime = undefined
    lastThis = undefined
    timeoutId = undefined
  }

  debounced.flush = function (): void {
    if (timeoutId !== undefined && lastArgs) {
      trailingEdge(Date.now())
      debounced.cancel()
    }
  }

  return debounced
}
