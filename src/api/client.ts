// src/api/client.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios'
import { getKeycloak, refreshToken, login, getToken, isAuthenticated } from '@/plugins/keycloak'
import router from '@/router'

// ============================================================================
// CONSTANTS
// ============================================================================

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8010'
const CONTENT_SERVICE_URL = import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8020'
const STORAGE_SERVICE_URL = import.meta.env.VITE_STORAGE_SERVICE_URL || 'http://localhost:8088'

// ============================================================================
// CLIENT FACTORY
// ============================================================================

function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // ============================================================================
  // REQUEST INTERCEPTOR
  // ============================================================================

  client.interceptors.request.use(
    async (config) => {
      const keycloak = getKeycloak()

      if (!keycloak) {
        console.warn('[API] Keycloak is not initialized')
        return config
      }

      // Обновляем токен если нужно (за 30 сек до истечения)
      if (isAuthenticated()) {
        try {
          await keycloak.updateToken(30)
        } catch (error) {
          console.error('[API] Token update failed:', error)
          login()
          return Promise.reject(error)
        }
      }

      // Добавляем токен
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // ============================================================================
  // RESPONSE INTERCEPTOR
  // ============================================================================

  client.interceptors.response.use(
    (response) => {
      // ✅ ДОБАВЛЕНО: Проверка пустых данных
      if (response.data === null || response.data === undefined) {
        console.warn('[API] Empty response data:', response.config.url)
      }
      return response
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

      // 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshed = await refreshToken(5)
          const token = getToken()

          if (refreshed && token) {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return client(originalRequest)
          } else {
            console.warn('[API] Token refresh failed, redirecting to login')
            login()
            return Promise.reject(error)
          }
        } catch (refreshError) {
          console.error('[API] Token refresh error:', refreshError)
          login()
          return Promise.reject(refreshError)
        }
      }

      // 403 Forbidden
      if (error.response?.status === 403) {
        console.error('[API] Access denied (403):', error.config?.url)
        router.push('/forbidden')
      }

      // 404 Not Found
      if (error.response?.status === 404) {
        console.warn('[API] Resource not found (404):', error.config?.url)
      }

      // 500+ Server Errors
      if (error.response?.status && error.response.status >= 500) {
        console.error('[API] Server error:', error.response.status, error.config?.url)
      }

      return Promise.reject(error)
    },
  )

  return client
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
 * Обработка API ошибок с детальным сообщением
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'

    // ✅ ДОБАВЛЕНО: Логирование для debugging
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message,
        data: error.response?.data,
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
    return error.response?.data?.errors || null
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
