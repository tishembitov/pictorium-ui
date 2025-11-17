/**
 * Axios instance с Keycloak interceptors
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios'
import { keycloak, refreshToken } from '@/plugins/keycloak'
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
      // Проверяем, нужно ли обновить токен (за 30 секунд до истечения)
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30)
        } catch (error) {
          console.error('[Keycloak] Token update failed:', error)
          keycloak.login()
          return Promise.reject(error)
        }
      }

      // Добавляем токен в заголовок
      const token = keycloak.token
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

          if (refreshed && keycloak.token) {
            // Повторяем оригинальный запрос с новым токеном
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${keycloak.token}`
            }
            return client(originalRequest)
          } else {
            // Не удалось обновить токен - редирект на login
            keycloak.login()
            return Promise.reject(error)
          }
        } catch (refreshError) {
          // Ошибка обновления токена - редирект на login
          console.error('[Keycloak] Token refresh failed:', refreshError)
          keycloak.login()
          return Promise.reject(refreshError)
        }
      }

      // Обработка 403 Forbidden
      if (error.response?.status === 403) {
        console.error('[API] Access denied (403)')
        router.push('/forbidden')
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

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message
    return message
  }
  return 'An unexpected error occurred'
}

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error)
}
