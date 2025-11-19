import type { App } from 'vue'
import axios from 'axios'
import { getKeycloak } from './keycloak'

export function setupAxios(app: App) {
  // Base URL
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  // Timeout
  axios.defaults.timeout = 30000

  // Credentials
  axios.defaults.withCredentials = true

  // Request Interceptor - добавляем Keycloak токен
  axios.interceptors.request.use(
    (config) => {
      const keycloak = getKeycloak()

      if (keycloak?.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // Response Interceptor - обработка ошибок
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const keycloak = getKeycloak()

      // Если 401 - обновляем токен
      if (error.response?.status === 401 && keycloak) {
        try {
          const refreshed = await keycloak.updateToken(70)

          if (refreshed && error.config) {
            // Повторяем запрос с новым токеном
            error.config.headers.Authorization = `Bearer ${keycloak.token}`
            return axios.request(error.config)
          }
        } catch (refreshError) {
          // Если не удалось обновить токен - logout
          keycloak.logout()
        }
      }

      return Promise.reject(error)
    },
  )

  // Глобальный доступ к axios
  app.config.globalProperties.$axios = axios
  app.provide('axios', axios)
}
