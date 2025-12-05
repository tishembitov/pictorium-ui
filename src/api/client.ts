// src/api/client.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type CancelToken,
} from 'axios'
import { getKeycloak, refreshToken, login, getToken, isAuthenticated } from '@/plugins/keycloak'
import router from '@/router'
import { logger } from '@/utils/logger'

// ============================================================================
// CONSTANTS
// ============================================================================

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8010'
const CONTENT_SERVICE_URL = import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8020'
const STORAGE_SERVICE_URL = import.meta.env.VITE_STORAGE_SERVICE_URL || 'http://localhost:8088'

const REQUEST_TIMEOUT = 30000
const TOKEN_REFRESH_THRESHOLD = 30 // секунд до истечения
const TOKEN_REFRESH_MIN_VALIDITY = 5 // секунд для retry

// ============================================================================
// CLIENT FACTORY
// ============================================================================

function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // ==========================================================================
  // REQUEST INTERCEPTOR
  // ==========================================================================

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const keycloak = getKeycloak()

      if (!keycloak) {
        logger.warn('Keycloak is not initialized')
        return config
      }

      // Обновляем токен если пользователь аутентифицирован
      if (isAuthenticated()) {
        try {
          const refreshed = await keycloak.updateToken(TOKEN_REFRESH_THRESHOLD)
          if (refreshed) {
            logger.debug('Token refreshed via request interceptor')
          }
        } catch (error) {
          logger.error('Token update failed in request interceptor:', error)
          // Не вызываем login() здесь - пусть response interceptor обработает 401
          // Возвращаем config без токена, сервер вернет 401
        }
      }

      // Добавляем токен в заголовок
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // API logging
      if (config.method && config.url) {
        logger.api(config.method, config.url)
      }

      return config
    },
    (error) => {
      logger.error('Request interceptor error:', error)
      return Promise.reject(error)
    },
  )

  // ==========================================================================
  // RESPONSE INTERCEPTOR
  // ==========================================================================

  client.interceptors.response.use(
    (response) => {
      // Проверка пустых данных
      if (response.data === null || response.data === undefined) {
        logger.warn('Empty response data:', response.config.url)
      }

      return response
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retry?: boolean
        _retryCount?: number
      }

      // Если нет config - это ошибка сети
      if (!originalRequest) {
        console.error('[API] Network error - no request config')
        return Promise.reject(error)
      }

      const status = error.response?.status

      // ========================================================================
      // 401 Unauthorized - попытка refresh token
      // ========================================================================
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1

        // Максимум 2 попытки
        if (originalRequest._retryCount > 2) {
          console.error('[API] Max retry attempts reached')
          redirectToLogin()
          return Promise.reject(error)
        }

        try {
          const refreshed = await refreshToken(TOKEN_REFRESH_MIN_VALIDITY)
          const token = getToken()

          if (refreshed && token) {
            console.log('[API] Token refreshed successfully, retrying request')

            // Обновляем заголовок и повторяем запрос
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }

            return client(originalRequest)
          } else {
            console.warn('[API] Token refresh returned false')
            redirectToLogin()
            return Promise.reject(error)
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError)
          redirectToLogin()
          return Promise.reject(refreshError)
        }
      }

      // ========================================================================
      // 403 Forbidden
      // ========================================================================
      if (status === 403) {
        console.error('[API] Access denied (403):', originalRequest.url)

        // Опционально: редирект на страницу forbidden
        // Можно отключить если компонент сам обрабатывает
        if (shouldRedirectOnForbidden(originalRequest.url)) {
          router.push({ name: 'forbidden' })
        }
      }

      // ========================================================================
      // 404 Not Found
      // ========================================================================
      if (status === 404) {
        console.warn('[API] Resource not found (404):', originalRequest.url)
        // Не редиректим - пусть компонент решает
      }

      // ========================================================================
      // 422 Validation Error
      // ========================================================================
      if (status === 422) {
        console.warn('[API] Validation error (422):', originalRequest.url, error.response?.data)
      }

      // ========================================================================
      // 429 Too Many Requests
      // ========================================================================
      if (status === 429) {
        console.warn('[API] Rate limited (429):', originalRequest.url)
        // Можно добавить retry с exponential backoff
      }

      // ========================================================================
      // 500+ Server Errors
      // ========================================================================
      if (status && status >= 500) {
        console.error('[API] Server error:', status, originalRequest.url)
      }

      // ========================================================================
      // Network Errors
      // ========================================================================
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          console.error('[API] Request timeout:', originalRequest.url)
        } else if (error.message === 'Network Error') {
          console.error('[API] Network error - check internet connection')
        } else {
          console.error('[API] Unknown error:', error.message)
        }
      }

      return Promise.reject(error)
    },
  )

  return client
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Редирект на логин с сохранением текущего URL
 */
function redirectToLogin(): void {
  // Проверяем, не находимся ли мы уже на странице логина
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const publicPaths = ['/landing', '/portfolio', '/unauthorized', '/forbidden']

  if (publicPaths.some((path) => currentPath.startsWith(path))) {
    console.log('[API] Already on public page, skipping login redirect')
    return
  }

  // Сохраняем текущий URL для редиректа после логина
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search)
  }

  console.warn('[API] Redirecting to login...')
  login()
}

/**
 * Проверка, нужно ли редиректить на forbidden
 */
function shouldRedirectOnForbidden(url?: string): boolean {
  // Не редиректим для некоторых API endpoints
  const skipRedirectPatterns = [
    '/api/v1/subscriptions/check',
    '/api/v1/pins/.*/likes',
    '/api/v1/comments/.*/likes',
  ]

  if (!url) return true

  return !skipRedirectPatterns.some((pattern) => new RegExp(pattern).test(url))
}

// ============================================================================
// API CLIENTS
// ============================================================================

export const userServiceClient = createApiClient(USER_SERVICE_URL)
export const contentServiceClient = createApiClient(CONTENT_SERVICE_URL)
export const storageServiceClient = createApiClient(STORAGE_SERVICE_URL)

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Извлечь сообщение об ошибке из API ответа
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const response = error.response

    // Пробуем разные форматы ошибок
    const message =
      response?.data?.message ||
      response?.data?.error ||
      response?.data?.detail ||
      (typeof response?.data === 'string' ? response.data : null) ||
      error.message ||
      'An unexpected error occurred'

    // Debug logging
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: response?.status,
        message,
        data: response?.data,
      })
    }

    return message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

/**
 * Проверка, является ли ошибка Axios ошибкой
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error)
}

/**
 * Получить статус код ошибки
 */
export function getErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) {
    return error.response?.status ?? null
  }
  return null
}

/**
 * Проверить, является ли ошибка ошибкой авторизации
 */
export function isUnauthorizedError(error: unknown): boolean {
  return getErrorStatus(error) === 401
}

/**
 * Проверить, является ли ошибка ошибкой доступа
 */
export function isForbiddenError(error: unknown): boolean {
  return getErrorStatus(error) === 403
}

/**
 * Проверить, является ли ошибка Not Found
 */
export function isNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404
}

/**
 * Проверить, является ли ошибка ошибкой валидации
 */
export function isValidationError(error: unknown): boolean {
  return getErrorStatus(error) === 422
}

/**
 * Проверить, является ли ошибка серверной ошибкой
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error)
  return status !== null && status >= 500
}

/**
 * Получить валидационные ошибки (если есть)
 */
export function getValidationErrors(error: unknown): Record<string, string[]> | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    // Формат 1: { errors: { field: ['error1', 'error2'] } }
    if (data?.errors && typeof data.errors === 'object') {
      return data.errors
    }

    // Формат 2: { field: ['error1', 'error2'] }
    if (data && typeof data === 'object' && !data.message) {
      const errors: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          errors[key] = value.map(String)
        } else if (typeof value === 'string') {
          errors[key] = [value]
        }
      }
      if (Object.keys(errors).length > 0) {
        return errors
      }
    }
  }

  return null
}

/**
 * Проверить, является ли ошибка сетевой
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response && error.message === 'Network Error'
  }
  return false
}

/**
 * Проверить, была ли ошибка timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.code === 'ECONNABORTED'
  }
  return false
}

/**
 * Создать отменяемый запрос
 */
export function createCancelToken(): {
  token: CancelToken // ← Исправленный тип
  cancel: (message?: string) => void
} {
  const source = axios.CancelToken.source()
  return {
    token: source.token,
    cancel: source.cancel,
  }
}

/**
 * Проверить, можно ли повторить запрос
 */
export function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false

  // Сетевые ошибки и таймауты можно повторить
  if (isNetworkError(error) || isTimeoutError(error)) return true

  // Серверные ошибки (кроме 501 Not Implemented) можно повторить
  const status = getErrorStatus(error)
  if (status && status >= 500 && status !== 501) return true

  // 429 Too Many Requests - можно повторить после задержки
  if (status === 429) return true

  return false
}

/**
 * Получить рекомендуемую задержку для retry (из заголовка Retry-After)
 */
export function getRetryAfter(error: unknown): number | null {
  if (axios.isAxiosError(error)) {
    const retryAfter = error.response?.headers?.['retry-after']

    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10)
      if (!isNaN(seconds)) {
        return seconds * 1000 // Convert to milliseconds
      }
    }
  }

  return null
}

/**
 * Проверить, была ли ошибка отменой запроса
 */
export function isCancelledError(error: unknown): boolean {
  return axios.isCancel(error)
}
