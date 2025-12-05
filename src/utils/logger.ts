// src/utils/logger.ts
/**
 * Centralized logging utility
 */

const isDev = import.meta.env.DEV

export const logger = {
  /**
   * Debug log (only in development)
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Info log
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * Warning log
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Error log
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },

  /**
   * API request log
   */
  api: (method: string, url: string) => {
    if (isDev) {
      console.log(`[API] ${method.toUpperCase()} ${url}`)
    }
  },

  /**
   * Store action log
   */
  store: (store: string, action: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[Store:${store}] ${action}`, ...args)
    }
  },
}

