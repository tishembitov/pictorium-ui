// src/plugins/axios.ts
import type { App } from 'vue'
import { userServiceClient, contentServiceClient, storageServiceClient } from '@/api/client'

/**
 * Setup Axios instances as global properties
 * Использование: this.$userApi, this.$contentApi, this.$storageApi
 */
export function setupAxios(app: App) {
  // Основной клиент (для обратной совместимости)
  app.config.globalProperties.$axios = contentServiceClient

  // Специфичные клиенты
  app.config.globalProperties.$userApi = userServiceClient
  app.config.globalProperties.$contentApi = contentServiceClient
  app.config.globalProperties.$storageApi = storageServiceClient

  // Provide для Composition API
  app.provide('axios', contentServiceClient)
  app.provide('userApi', userServiceClient)
  app.provide('contentApi', contentServiceClient)
  app.provide('storageApi', storageServiceClient)

  console.log('[Axios] API clients configured')
}

// Типы для глобальных свойств
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: typeof contentServiceClient
    $userApi: typeof userServiceClient
    $contentApi: typeof contentServiceClient
    $storageApi: typeof storageServiceClient
  }
}
