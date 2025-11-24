// src/stores/user.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { usersApi } from '@/api/users.api'
import { storageApi } from '@/api/storage.api'
import { useAuthStore } from './auth.store'

export const useUserStore = defineStore('user', () => {
  // ============ STATE ============

  // Текущий пользователь
  const currentUser = ref<User | null>(null)

  // Blob URLs для медиа
  const avatarBlobUrl = ref<string | null>(null)
  const bannerBlobUrl = ref<string | null>(null)

  // Кэш пользователей (key: userId)
  const usersCache = ref<Map<string, User>>(new Map())

  // Кэш аватаров (key: userId)
  const avatarsCache = ref<Map<string, string>>(new Map())

  // Loading states
  const isLoadingProfile = ref(true)
  const isUpdatingProfile = ref(false)
  const isUploadingAvatar = ref(false)
  const isUploadingBanner = ref(false)

  // ============ GETTERS ============

  const userId = computed(() => currentUser.value?.id || null)
  const username = computed(() => currentUser.value?.username || null)
  const email = computed(() => currentUser.value?.email || null)
  const userImage = computed(() => avatarBlobUrl.value || null)
  const userBanner = computed(() => bannerBlobUrl.value || null)

  const hasProfile = computed(() => currentUser.value !== null)

  const getUserById = computed(() => (id: string) => {
    return usersCache.value.get(id)
  })

  const getAvatarUrl = computed(() => (userId: string) => {
    return avatarsCache.value.get(userId)
  })

  // ============ ACTIONS ============

  /**
   * Загрузка профиля текущего пользователя
   */
  async function loadCurrentUser() {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      console.warn('[User] User not authenticated')
      return null
    }

    try {
      isLoadingProfile.value = true

      // Получаем данные из User Service
      const userData = await usersApi.getCurrentUser()
      currentUser.value = userData

      // Кэшируем
      usersCache.value.set(userData.id, userData)

      // Загружаем медиа параллельно
      await Promise.allSettled([
        loadUserAvatar(userData.imageUrl),
        loadUserBanner(userData.bannerImageUrl),
      ])

      console.log('[User] Profile loaded:', userData)
      return userData
    } catch (error) {
      console.error('[User] Failed to load profile:', error)
      throw error
    } finally {
      isLoadingProfile.value = false
    }
  }

  /**
   * Загрузка пользователя по username
   */
  async function loadUserByUsername(username: string, forceReload = false) {
    try {
      // Проверяем кэш
      const cached = Array.from(usersCache.value.values()).find((u) => u.username === username)
      if (cached && !forceReload) {
        return cached
      }

      const user = await usersApi.getUserByUsername(username)

      // Кэшируем
      usersCache.value.set(user.id, user)

      // Загружаем аватар
      if (user.imageUrl) {
        await loadUserAvatarById(user.id, user.imageUrl)
      }

      return user
    } catch (error) {
      console.error('[User] Failed to load user by username:', error)
      throw error
    }
  }

  /**
   * Загрузка пользователя по ID
   */
  async function loadUserById(userId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && usersCache.value.has(userId)) {
        return usersCache.value.get(userId)!
      }

      const user = await usersApi.getUserById(userId)

      // Кэшируем
      usersCache.value.set(userId, user)

      // Загружаем аватар
      if (user.imageUrl) {
        await loadUserAvatarById(userId, user.imageUrl)
      }

      return user
    } catch (error) {
      console.error('[User] Failed to load user by ID:', error)
      throw error
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
      isUpdatingProfile.value = true

      const updated = await usersApi.updateUser(data)
      currentUser.value = updated

      // Обновляем кэш
      usersCache.value.set(updated.id, updated)

      console.log('[User] Profile updated:', updated)
      return updated
    } catch (error) {
      console.error('[User] Failed to update profile:', error)
      throw error
    } finally {
      isUpdatingProfile.value = false
    }
  }

  /**
   * Загрузка нового аватара
   */
  async function uploadAvatar(file: File) {
    try {
      isUploadingAvatar.value = true

      // 1. Загружаем в Storage Service
      const uploadResponse = await storageApi.uploadImage({
        file,
        category: 'avatars',
        generateThumbnail: true,
        thumbnailWidth: 200,
        thumbnailHeight: 200,
      })

      // 2. Обновляем профиль
      const updated = await usersApi.updateUser({
        imageId: uploadResponse.imageId,
        imageUrl: uploadResponse.imageUrl,
      })

      currentUser.value = updated

      // 3. Обновляем локальный blob
      if (avatarBlobUrl.value) {
        URL.revokeObjectURL(avatarBlobUrl.value)
      }
      avatarBlobUrl.value = URL.createObjectURL(file)

      // Обновляем кэш
      usersCache.value.set(updated.id, updated)
      avatarsCache.value.set(updated.id, avatarBlobUrl.value)

      console.log('[User] Avatar uploaded:', uploadResponse)
      return uploadResponse
    } catch (error) {
      console.error('[User] Failed to upload avatar:', error)
      throw error
    } finally {
      isUploadingAvatar.value = false
    }
  }

  /**
   * Удаление аватара
   */
  async function removeAvatar() {
    try {
      isUploadingAvatar.value = true

      const updated = await usersApi.updateUser({
        imageId: null,
        imageUrl: null,
      })

      currentUser.value = updated

      // Очищаем blob
      if (avatarBlobUrl.value) {
        URL.revokeObjectURL(avatarBlobUrl.value)
        avatarBlobUrl.value = null
      }

      // Обновляем кэш
      if (updated.id) {
        usersCache.value.set(updated.id, updated)
        avatarsCache.value.delete(updated.id)
      }
    } catch (error) {
      console.error('[User] Failed to remove avatar:', error)
      throw error
    } finally {
      isUploadingAvatar.value = false
    }
  }

  /**
   * Загрузка нового баннера
   */
  async function uploadBanner(file: File) {
    try {
      isUploadingBanner.value = true

      const uploadResponse = await storageApi.uploadImage({
        file,
        category: 'banners',
        generateThumbnail: false,
      })

      const updated = await usersApi.updateUser({
        bannerImageId: uploadResponse.imageId,
        bannerImageUrl: uploadResponse.imageUrl,
      })

      currentUser.value = updated

      if (bannerBlobUrl.value) {
        URL.revokeObjectURL(bannerBlobUrl.value)
      }
      bannerBlobUrl.value = URL.createObjectURL(file)

      // Обновляем кэш
      usersCache.value.set(updated.id, updated)

      console.log('[User] Banner uploaded:', uploadResponse)
      return uploadResponse
    } catch (error) {
      console.error('[User] Failed to upload banner:', error)
      throw error
    } finally {
      isUploadingBanner.value = false
    }
  }

  /**
   * Удаление баннера
   */
  async function removeBanner() {
    try {
      isUploadingBanner.value = true

      const updated = await usersApi.updateUser({
        bannerImageId: null,
        bannerImageUrl: null,
      })

      currentUser.value = updated

      if (bannerBlobUrl.value) {
        URL.revokeObjectURL(bannerBlobUrl.value)
        bannerBlobUrl.value = null
      }

      if (updated.id) {
        usersCache.value.set(updated.id, updated)
      }
    } catch (error) {
      console.error('[User] Failed to remove banner:', error)
      throw error
    } finally {
      isUploadingBanner.value = false
    }
  }

  /**
   * Загрузка аватара текущего пользователя
   */
  async function loadUserAvatar(imageUrl: string | null) {
    try {
      if (!imageUrl) {
        avatarBlobUrl.value = null
        return
      }

      const blob = await storageApi.downloadImage(imageUrl)
      avatarBlobUrl.value = URL.createObjectURL(blob)

      // Кэшируем
      if (currentUser.value?.id) {
        avatarsCache.value.set(currentUser.value.id, avatarBlobUrl.value)
      }
    } catch (error) {
      console.error('[User] Failed to load avatar:', error)
      avatarBlobUrl.value = null
    }
  }

  /**
   * Загрузка баннера текущего пользователя
   */
  async function loadUserBanner(imageUrl: string | null) {
    try {
      if (!imageUrl) {
        bannerBlobUrl.value = null
        return
      }

      const blob = await storageApi.downloadImage(imageUrl)
      bannerBlobUrl.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('[User] Failed to load banner:', error)
      bannerBlobUrl.value = null
    }
  }

  /**
   * Загрузка аватара другого пользователя
   */
  async function loadUserAvatarById(userId: string, imageUrl: string) {
    try {
      // Проверяем кэш
      if (avatarsCache.value.has(userId)) {
        return avatarsCache.value.get(userId)!
      }

      const blob = await storageApi.downloadImage(imageUrl)
      const blobUrl = URL.createObjectURL(blob)

      avatarsCache.value.set(userId, blobUrl)
      return blobUrl
    } catch (error) {
      console.error(`[User] Failed to load avatar for user ${userId}:`, error)
      return null
    }
  }

  /**
   * Предзагрузка аватаров для списка пользователей
   */
  async function preloadAvatars(users: User[]) {
    const promises = users
      .filter((user) => user.imageUrl && !avatarsCache.value.has(user.id))
      .map((user) => loadUserAvatarById(user.id, user.imageUrl!))

    await Promise.allSettled(promises)
  }

  /**
   * Очистка кэша пользователя
   */
  function clearUserCache(userId: string) {
    usersCache.value.delete(userId)

    const avatarUrl = avatarsCache.value.get(userId)
    if (avatarUrl) {
      URL.revokeObjectURL(avatarUrl)
      avatarsCache.value.delete(userId)
    }
  }

  /**
   * Очистка всех данных (logout)
   */
  function clearAll() {
    // Очищаем blob URLs
    if (avatarBlobUrl.value) {
      URL.revokeObjectURL(avatarBlobUrl.value)
    }
    if (bannerBlobUrl.value) {
      URL.revokeObjectURL(bannerBlobUrl.value)
    }

    // Очищаем кэш аватаров
    avatarsCache.value.forEach((url) => {
      URL.revokeObjectURL(url)
    })

    // Сбрасываем state
    currentUser.value = null
    avatarBlobUrl.value = null
    bannerBlobUrl.value = null
    usersCache.value.clear()
    avatarsCache.value.clear()
    isLoadingProfile.value = true
  }

  /**
   * Сброс store (для тестов)
   */
  function $reset() {
    clearAll()
    isUpdatingProfile.value = false
    isUploadingAvatar.value = false
    isUploadingBanner.value = false
  }

  return {
    // State
    currentUser,
    avatarBlobUrl,
    bannerBlobUrl,
    usersCache,
    avatarsCache,
    isLoadingProfile,
    isUpdatingProfile,
    isUploadingAvatar,
    isUploadingBanner,

    // Getters
    userId,
    username,
    email,
    userImage,
    userBanner,
    hasProfile,
    getUserById,
    getAvatarUrl,

    // Actions
    loadCurrentUser,
    loadUserByUsername,
    loadUserById,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    uploadBanner,
    removeBanner,
    loadUserAvatar,
    loadUserBanner,
    loadUserAvatarById,
    preloadAvatars,
    clearUserCache,
    clearAll,
    $reset,
  }
})
