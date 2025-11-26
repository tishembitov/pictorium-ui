// src/composables/api/usePinLikes.ts
/**
 * usePinLikes - Загрузка списка пользователей, лайкнувших пин
 *
 * API возвращает Like[] (с userId), поэтому загружаем User для каждого лайка
 */

import { ref, computed, onUnmounted } from 'vue'
import { likesApi, usersApi, storageApi } from '@/api'
import type { User, Like, Pageable } from '@/types'

export interface LikeUser extends User {
  avatarBlobUrl?: string
  likedAt: string
}

export interface UsePinLikesOptions {
  pageSize?: number
  immediate?: boolean
}

export function usePinLikes(pinId: string | (() => string), options: UsePinLikesOptions = {}) {
  const { pageSize = 10, immediate = false } = options

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  // State
  const users = ref<LikeUser[]>([])
  const page = ref(0)
  const totalElements = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Load user with avatar
  async function loadUserWithAvatar(like: Like): Promise<LikeUser | null> {
    try {
      // Загружаем данные пользователя
      const user = await usersApi.getUserById(like.userId)

      const likeUser: LikeUser = {
        ...user,
        likedAt: like.createdAt,
      }

      // Загружаем аватар если есть
      if (user.imageUrl) {
        try {
          const blob = await storageApi.downloadImage(user.imageUrl)
          likeUser.avatarBlobUrl = URL.createObjectURL(blob)
        } catch (e) {
          console.warn(`[usePinLikes] Failed to load avatar for user ${user.id}:`, e)
        }
      }

      return likeUser
    } catch (e) {
      console.error(`[usePinLikes] Failed to load user ${like.userId}:`, e)
      return null
    }
  }

  // Fetch likes
  async function fetch(pageNum = 0, reset = false): Promise<LikeUser[]> {
    if (isLoading.value) return []

    try {
      isLoading.value = true
      error.value = null

      if (reset) {
        // Cleanup old blob URLs
        users.value.forEach((user) => {
          if (user.avatarBlobUrl) {
            URL.revokeObjectURL(user.avatarBlobUrl)
          }
        })
        users.value = []
        page.value = 0
        hasMore.value = true
      }

      const pageable: Pageable = {
        page: pageNum,
        size: pageSize,
        sort: ['createdAt,desc'],
      }

      const response = await likesApi.getPinLikes(getId(), { pinId: getId(), pageable })

      // Load users for each like
      const loadedUsers = await Promise.all(response.content.map(loadUserWithAvatar))

      // Filter out failed loads
      const validUsers = loadedUsers.filter((u): u is LikeUser => u !== null)

      if (pageNum === 0 || reset) {
        users.value = validUsers
      } else {
        users.value.push(...validUsers)
      }

      page.value = response.number
      totalElements.value = response.totalElements
      hasMore.value = !response.last

      return validUsers
    } catch (e) {
      error.value = e as Error
      console.error('[usePinLikes] Failed to fetch likes:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Load more
  async function loadMore(): Promise<LikeUser[]> {
    if (!hasMore.value || isLoading.value) return []
    return await fetch(page.value + 1)
  }

  // Reset
  function reset() {
    users.value.forEach((user) => {
      if (user.avatarBlobUrl) {
        URL.revokeObjectURL(user.avatarBlobUrl)
      }
    })
    users.value = []
    page.value = 0
    totalElements.value = 0
    hasMore.value = true
    error.value = null
  }

  // Cleanup on unmount
  onUnmounted(() => {
    users.value.forEach((user) => {
      if (user.avatarBlobUrl) {
        URL.revokeObjectURL(user.avatarBlobUrl)
      }
    })
  })

  // Immediate fetch if requested
  if (immediate) {
    fetch(0)
  }

  return {
    users: computed(() => users.value),
    isLoading: computed(() => isLoading.value),
    hasMore: computed(() => hasMore.value),
    error: computed(() => error.value),
    page: computed(() => page.value),
    totalElements: computed(() => totalElements.value),
    fetch,
    loadMore,
    reset,
  }
}
