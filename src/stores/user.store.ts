// src/stores/user.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { User } from '@/types'
import { usersApi, storageApi } from '@/api'
import { useAuthStore } from './auth.store'

const MAX_USERS_CACHE_SIZE = 100
const MAX_AVATARS_CACHE_SIZE = 100

export const useUserStore = defineStore('user', () => {
  // ============ STATE ============

  const currentUser = ref<User | null>(null)
  const avatarBlobUrl = ref<string | null>(null)
  const bannerBlobUrl = ref<string | null>(null)

  const usersCache = reactive(new Map<string, User>())
  const usersCacheOrder = reactive<string[]>([])

  const avatarsCache = reactive(new Map<string, string>())
  const avatarsCacheOrder = reactive<string[]>([])

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
    return usersCache.get(id)
  })

  const getAvatarUrl = computed(() => (userId: string) => {
    return avatarsCache.get(userId)
  })

  // ============ ACTIONS ============

  async function loadCurrentUser() {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      console.warn('[User] User not authenticated')
      isLoadingProfile.value = false
      return null
    }

    try {
      isLoadingProfile.value = true

      const userData = await usersApi.getCurrentUser()
      currentUser.value = userData

      cacheUser(userData)

      await Promise.allSettled([
        loadUserAvatar(userData.imageId),
        loadUserBanner(userData.bannerImageId),
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

  async function loadUserByUsername(username: string, forceReload = false) {
    try {
      const cached = Array.from(usersCache.values()).find((u) => u.username === username)
      if (cached && !forceReload) {
        updateUserCacheOrder(cached.id)
        return cached
      }

      const user = await usersApi.getUserByUsername(username)
      cacheUser(user)

      if (user.imageId) {
        await loadUserAvatarById(user.id, user.imageId)
      }

      return user
    } catch (error) {
      console.error('[User] Failed to load user by username:', error)
      throw error
    }
  }

  async function loadUserById(userId: string, forceReload = false) {
    try {
      if (!forceReload && usersCache.has(userId)) {
        updateUserCacheOrder(userId)
        return usersCache.get(userId)!
      }

      const user = await usersApi.getUserById(userId)
      cacheUser(user)

      if (user.imageId) {
        await loadUserAvatarById(userId, user.imageId)
      }

      return user
    } catch (error) {
      console.error('[User] Failed to load user by ID:', error)
      throw error
    }
  }

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
      cacheUser(updated)

      console.log('[User] Profile updated:', updated)
      return updated
    } catch (error) {
      console.error('[User] Failed to update profile:', error)
      throw error
    } finally {
      isUpdatingProfile.value = false
    }
  }

  async function uploadAvatar(file: File) {
    try {
      isUploadingAvatar.value = true

      const uploadResponse = await storageApi.uploadImage(file, {
        category: 'avatars',
        generateThumbnail: true,
        thumbnailWidth: 200,
        thumbnailHeight: 200,
      })

      const updated = await usersApi.updateUser({
        imageId: uploadResponse.imageId,
      })

      currentUser.value = updated

      if (avatarBlobUrl.value) {
        URL.revokeObjectURL(avatarBlobUrl.value)
      }
      avatarBlobUrl.value = URL.createObjectURL(file)

      cacheUser(updated)
      cacheAvatar(updated.id, avatarBlobUrl.value)

      console.log('[User] Avatar uploaded:', uploadResponse)
      return uploadResponse
    } catch (error) {
      console.error('[User] Failed to upload avatar:', error)
      throw error
    } finally {
      isUploadingAvatar.value = false
    }
  }

  async function removeAvatar() {
    try {
      isUploadingAvatar.value = true

      const updated = await usersApi.updateUser({
        imageId: undefined,
      })

      currentUser.value = updated

      if (avatarBlobUrl.value) {
        URL.revokeObjectURL(avatarBlobUrl.value)
        avatarBlobUrl.value = null
      }

      if (updated.id) {
        cacheUser(updated)
        avatarsCache.delete(updated.id)
        const index = avatarsCacheOrder.indexOf(updated.id)
        if (index !== -1) {
          avatarsCacheOrder.splice(index, 1)
        }
      }
    } catch (error) {
      console.error('[User] Failed to remove avatar:', error)
      throw error
    } finally {
      isUploadingAvatar.value = false
    }
  }

  async function uploadBanner(file: File) {
    try {
      isUploadingBanner.value = true

      const uploadResponse = await storageApi.uploadImage(file, {
        category: 'banners',
        generateThumbnail: false,
      })

      const updated = await usersApi.updateUser({
        bannerImageId: uploadResponse.imageId,
      })

      currentUser.value = updated

      if (bannerBlobUrl.value) {
        URL.revokeObjectURL(bannerBlobUrl.value)
      }
      bannerBlobUrl.value = URL.createObjectURL(file)

      cacheUser(updated)

      console.log('[User] Banner uploaded:', uploadResponse)
      return uploadResponse
    } catch (error) {
      console.error('[User] Failed to upload banner:', error)
      throw error
    } finally {
      isUploadingBanner.value = false
    }
  }

  async function removeBanner() {
    try {
      isUploadingBanner.value = true

      const updated = await usersApi.updateUser({
        bannerImageId: undefined,
      })

      currentUser.value = updated

      if (bannerBlobUrl.value) {
        URL.revokeObjectURL(bannerBlobUrl.value)
        bannerBlobUrl.value = null
      }

      if (updated.id) {
        cacheUser(updated)
      }
    } catch (error) {
      console.error('[User] Failed to remove banner:', error)
      throw error
    } finally {
      isUploadingBanner.value = false
    }
  }

  async function loadUserAvatar(imageId: string | null) {
    try {
      if (!imageId) {
        avatarBlobUrl.value = null
        return
      }

      const blob = await storageApi.downloadImage(imageId)
      avatarBlobUrl.value = URL.createObjectURL(blob)

      if (currentUser.value?.id) {
        cacheAvatar(currentUser.value.id, avatarBlobUrl.value)
      }
    } catch (error) {
      console.error('[User] Failed to load avatar:', error)
      avatarBlobUrl.value = null
    }
  }

  async function loadUserBanner(bannerImageId: string | null) {
    try {
      if (!bannerImageId) {
        bannerBlobUrl.value = null
        return
      }

      const blob = await storageApi.downloadImage(bannerImageId)
      bannerBlobUrl.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('[User] Failed to load banner:', error)
      bannerBlobUrl.value = null
    }
  }

  async function loadUserAvatarById(userId: string, imageId: string) {
    try {
      if (avatarsCache.has(userId)) {
        updateAvatarCacheOrder(userId)
        return avatarsCache.get(userId)!
      }

      const blob = await storageApi.downloadImage(imageId)
      const blobUrl = URL.createObjectURL(blob)

      cacheAvatar(userId, blobUrl)
      return blobUrl
    } catch (error) {
      console.error(`[User] Failed to load avatar for user ${userId}:`, error)
      return null
    }
  }

  async function preloadAvatars(users: User[]) {
    const promises = users
      .filter((user) => user.imageId && !avatarsCache.has(user.id))
      .map((user) => loadUserAvatarById(user.id, user.imageId!))

    await Promise.allSettled(promises)
  }

  function clearUserCache(userId: string) {
    usersCache.delete(userId)
    const userIndex = usersCacheOrder.indexOf(userId)
    if (userIndex !== -1) {
      usersCacheOrder.splice(userIndex, 1)
    }

    const avatarUrl = avatarsCache.get(userId)
    if (avatarUrl) {
      URL.revokeObjectURL(avatarUrl)
      avatarsCache.delete(userId)
      const avatarIndex = avatarsCacheOrder.indexOf(userId)
      if (avatarIndex !== -1) {
        avatarsCacheOrder.splice(avatarIndex, 1)
      }
    }
  }

  function clearAll() {
    if (avatarBlobUrl.value) {
      URL.revokeObjectURL(avatarBlobUrl.value)
    }
    if (bannerBlobUrl.value) {
      URL.revokeObjectURL(bannerBlobUrl.value)
    }

    avatarsCache.forEach((url) => {
      URL.revokeObjectURL(url)
    })

    currentUser.value = null
    avatarBlobUrl.value = null
    bannerBlobUrl.value = null
    usersCache.clear()
    avatarsCache.clear()
    usersCacheOrder.length = 0
    avatarsCacheOrder.length = 0
    isLoadingProfile.value = true
  }

  function $reset() {
    clearAll()
    isUpdatingProfile.value = false
    isUploadingAvatar.value = false
    isUploadingBanner.value = false
  }

  // ============ LRU HELPERS ============

  function cacheUser(user: User) {
    const existingIndex = usersCacheOrder.indexOf(user.id)
    if (existingIndex !== -1) {
      usersCacheOrder.splice(existingIndex, 1)
    }

    usersCacheOrder.push(user.id)
    usersCache.set(user.id, user)

    if (usersCache.size > MAX_USERS_CACHE_SIZE) {
      const oldestUserId = usersCacheOrder.shift()!
      usersCache.delete(oldestUserId)
    }
  }

  function updateUserCacheOrder(userId: string) {
    const index = usersCacheOrder.indexOf(userId)
    if (index !== -1) {
      usersCacheOrder.splice(index, 1)
      usersCacheOrder.push(userId)
    }
  }

  function cacheAvatar(userId: string, blobUrl: string) {
    const existingIndex = avatarsCacheOrder.indexOf(userId)
    if (existingIndex !== -1) {
      avatarsCacheOrder.splice(existingIndex, 1)
      const oldUrl = avatarsCache.get(userId)
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl)
      }
    }

    avatarsCacheOrder.push(userId)
    avatarsCache.set(userId, blobUrl)

    if (avatarsCache.size > MAX_AVATARS_CACHE_SIZE) {
      const oldestUserId = avatarsCacheOrder.shift()!
      const oldUrl = avatarsCache.get(oldestUserId)
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl)
      }
      avatarsCache.delete(oldestUserId)
    }
  }

  function updateAvatarCacheOrder(userId: string) {
    const index = avatarsCacheOrder.indexOf(userId)
    if (index !== -1) {
      avatarsCacheOrder.splice(index, 1)
      avatarsCacheOrder.push(userId)
    }
  }

  return {
    currentUser,
    avatarBlobUrl,
    bannerBlobUrl,
    usersCache,
    avatarsCache,
    isLoadingProfile,
    isUpdatingProfile,
    isUploadingAvatar,
    isUploadingBanner,
    userId,
    username,
    email,
    userImage,
    userBanner,
    hasProfile,
    getUserById,
    getAvatarUrl,
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
