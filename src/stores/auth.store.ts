// src/stores/auth.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type Keycloak from 'keycloak-js'
import type { User } from '@/types'
import { usersApi } from '@/api/users.api'
import { storageApi } from '@/api/storage.api'

export const useAuthStore = defineStore('auth', () => {
  // ============ STATE ============
  const keycloak = ref<Keycloak | null>(null)
  const isAuthenticated = ref(false)
  const isInitialized = ref(false)

  // User data
  const user = ref<User | null>(null)
  const userImage = ref<string | null>(null)
  const bannerImage = ref<string | null>(null)

  // Loading states
  const loading = ref(false)
  const isLoadingProfile = ref(true)

  // ============ GETTERS ============
  const userId = computed(() => user.value?.id || null)
  const username = computed(() => user.value?.username || null)
  const email = computed(() => user.value?.email || null)
  const hasRole = computed(() => (role: string) => {
    return keycloak.value?.hasRealmRole(role) || false
  })
  const isAdmin = computed(() => hasRole.value('admin'))
  const token = computed(() => keycloak.value?.token || null)
  const refreshToken = computed(() => keycloak.value?.refreshToken || null)

  // ============ ACTIONS ============

  /**
   * Инициализация Keycloak и загрузка профиля
   */
  async function initKeycloak(keycloakInstance: Keycloak) {
    try {
      keycloak.value = keycloakInstance
      isAuthenticated.value = keycloakInstance.authenticated || false
      isInitialized.value = true

      if (isAuthenticated.value) {
        await loadUserProfile()
      }
    } catch (error) {
      console.error('Failed to initialize Keycloak:', error)
      throw error
    }
  }

  /**
   * Загрузка профиля текущего пользователя
   */
  async function loadUserProfile() {
    try {
      isLoadingProfile.value = true

      // Получаем данные пользователя из User Service
      const userData = await usersApi.getCurrentUser()
      user.value = userData

      // Загружаем изображения параллельно
      await Promise.allSettled([
        loadUserImage(userData.imageUrl),
        loadBannerImage(userData.bannerImageUrl),
      ])
    } catch (error) {
      console.error('Failed to load user profile:', error)
      throw error
    } finally {
      isLoadingProfile.value = false
    }
  }

  /**
   * Загрузка аватара пользователя
   */
  async function loadUserImage(imageId: string | null) {
    try {
      if (!imageId) return

      const blob = await storageApi.downloadImage(imageId)
      userImage.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to load user image:', error)
      userImage.value = null
    }
  }

  /**
   * Загрузка баннера пользователя
   */
  async function loadBannerImage(imageId: string | null) {
    try {
      if (!imageId) return

      const blob = await storageApi.downloadImage(imageId)
      bannerImage.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to load banner image:', error)
      bannerImage.value = null
    }
  }

  /**
   * Обновление профиля
   */
  async function updateProfile(data: {
    username?: string
    description?: string
    instagram?: string
    tiktok?: string
    telegram?: string
    pinterest?: string
  }) {
    try {
      loading.value = true
      const updated = await usersApi.updateUser(data)
      user.value = updated
      return updated
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Загрузка нового аватара
   */
  async function uploadAvatar(file: File) {
    try {
      loading.value = true

      // 1. Загружаем в Storage Service
      const uploadResponse = await storageApi.uploadImage({
        file,
        category: 'avatars',
        generateThumbnail: true,
        thumbnailWidth: 200,
        thumbnailHeight: 200,
      })

      // 2. Обновляем профиль с новым imageUrl
      const updated = await usersApi.updateUser({
        imageUrl: uploadResponse.imageId,
      })

      user.value = updated

      // 3. Обновляем локальный blob
      if (userImage.value) {
        URL.revokeObjectURL(userImage.value)
      }
      userImage.value = URL.createObjectURL(file)

      return uploadResponse
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Загрузка нового баннера
   */
  async function uploadBanner(file: File) {
    try {
      loading.value = true

      const uploadResponse = await storageApi.uploadImage({
        file,
        category: 'banners',
        generateThumbnail: false,
      })

      const updated = await usersApi.updateUser({
        bannerImageUrl: uploadResponse.imageId,
      })

      user.value = updated

      if (bannerImage.value) {
        URL.revokeObjectURL(bannerImage.value)
      }
      bannerImage.value = URL.createObjectURL(file)

      return uploadResponse
    } catch (error) {
      console.error('Failed to upload banner:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Login через Keycloak
   */
  async function login() {
    try {
      await keycloak.value?.login()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      // Очищаем blob URLs
      if (userImage.value) URL.revokeObjectURL(userImage.value)
      if (bannerImage.value) URL.revokeObjectURL(bannerImage.value)

      // Сбрасываем state
      user.value = null
      userImage.value = null
      bannerImage.value = null
      isAuthenticated.value = false

      // Выходим из Keycloak
      await keycloak.value?.logout()
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  /**
   * Обновление токена
   */
  async function updateToken(minValidity = 5) {
    try {
      const refreshed = await keycloak.value?.updateToken(minValidity)
      return refreshed
    } catch (error) {
      console.error('Token update failed:', error)
      await logout()
      throw error
    }
  }

  /**
   * Проверка авторизации (для guards)
   */
  async function checkAuth() {
    if (isAuthenticated.value && !user.value) {
      await loadUserProfile()
    }
  }

  /**
   * Сброс store (для тестов)
   */
  function $reset() {
    keycloak.value = null
    isAuthenticated.value = false
    isInitialized.value = false
    user.value = null
    userImage.value = null
    bannerImage.value = null
    loading.value = false
    isLoadingProfile.value = true
  }

  return {
    // State
    keycloak,
    isAuthenticated,
    isInitialized,
    user,
    userImage,
    bannerImage,
    loading,
    isLoadingProfile,

    // Getters
    userId,
    username,
    email,
    hasRole,
    isAdmin,
    token,
    refreshToken,

    // Actions
    initKeycloak,
    loadUserProfile,
    updateProfile,
    uploadAvatar,
    uploadBanner,
    login,
    logout,
    updateToken,
    checkAuth,
    $reset,
  }
})
