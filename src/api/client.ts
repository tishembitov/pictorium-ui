/**
 * Axios instance с Keycloak interceptors
 */

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
  // REQUEST INTERCEPTOR - Добавление Keycloak токена
  // ============================================================================

  client.interceptors.request.use(
    async (config) => {
      const keycloak = getKeycloak()

      if (!keycloak) {
        console.warn('[API] Keycloak is not initialized')
        return config
      }

      // Проверяем, нужно ли обновить токен (за 30 секунд до истечения)
      if (isAuthenticated()) {
        try {
          await keycloak.updateToken(30)
        } catch (error) {
          console.error('[Keycloak] Token update failed:', error)
          login()
          return Promise.reject(error)
        }
      }

      // Добавляем токен в заголовок
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
  // RESPONSE INTERCEPTOR - Обработка ошибок
  // ============================================================================

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

      // Обработка 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          // Пытаемся обновить токен через Keycloak
          const refreshed = await refreshToken(5)
          const token = getToken()

          if (refreshed && token) {
            // Повторяем оригинальный запрос с новым токеном
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return client(originalRequest)
          } else {
            // Не удалось обновить токен - редирект на login
            login()
            return Promise.reject(error)
          }
        } catch (refreshError) {
          // Ошибка обновления токена - редирект на login
          console.error('[Keycloak] Token refresh failed:', refreshError)
          login()
          return Promise.reject(refreshError)
        }
      }

      // Обработка 403 Forbidden
      if (error.response?.status === 403) {
        console.error('[API] Access denied (403)')
        router.push('/forbidden')
      }

      // Обработка 500+ Server Errors
      if (error.response?.status && error.response.status >= 500) {
        console.error('[API] Server error:', error.response.status)
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Обработка API ошибок с детальным сообщением
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Приоритет: message из response.data, потом общее сообщение ошибки
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'

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
 * Проверить, является ли ошибка серверной ошибкой
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error)
  return status !== null && status >= 500
}
