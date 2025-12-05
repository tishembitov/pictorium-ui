// src/composables/api/useLikesBase.ts
/**
 * useLikesBase - Базовый composable для загрузки лайков
 * Используется для унификации логики в usePinLikes и useCommentLikes
 */

import { ref, computed, onUnmounted } from 'vue'
import { usersApi, storageApi } from '@/api'
import type { User, Pageable, Like } from '@/types'
import { logger } from '@/utils/logger'

export interface LikeUser extends User {
  avatarBlobUrl?: string
  likedAt?: string
}

export interface UseLikesBaseOptions {
  pageSize?: number
  immediate?: boolean
}

export interface LikesFetcher {
  fetchLikes: (id: string, pageable: Pageable) => Promise<{ content: Like[]; number: number; totalElements: number; last: boolean }>
}

/**
 * Базовый composable для загрузки лайков
 */
export function useLikesBase<T extends LikeUser>(
  getId: () => string,
  fetcher: LikesFetcher,
  options: UseLikesBaseOptions = {},
) {
  const { pageSize = 10, immediate = false } = options

  // State
  const users = ref<LikeUser[]>([]) as { value: T[] }
  const page = ref(0)
  const totalElements = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Загрузить пользователя с аватаром
   */
  async function loadUserWithAvatar(like: Like): Promise<LikeUser | null> {
    try {
      const user = await usersApi.getUserById(like.userId)
      const likeUser = {
        ...user,
        likedAt: like.createdAt,
      } as T

      if (user.imageId) {
        try {
          const blob = await storageApi.downloadImage(user.imageId)
          likeUser.avatarBlobUrl = URL.createObjectURL(blob)
        } catch (e) {
          logger.warn(`Failed to load avatar for user ${user.id}:`, e)
        }
      }

      return likeUser
    } catch (e) {
      logger.error(`Failed to load user ${like.userId}:`, e)
      return null
    }
  }

  /**
   * Очистка blob URLs
   */
  function cleanup() {
    users.value.forEach((user) => {
      if (user.avatarBlobUrl) {
        URL.revokeObjectURL(user.avatarBlobUrl)
      }
    })
    users.value = []
  }

  /**
   * Загрузить лайки
   */
  async function fetch(pageNum = 0, reset = false): Promise<T[]> {
    if (isLoading.value) return []

    try {
      isLoading.value = true
      error.value = null

      if (reset) {
        cleanup()
        page.value = 0
        hasMore.value = true
      }

      const pageable: Pageable = {
        page: pageNum,
        size: pageSize,
        sort: ['createdAt,desc'],
      }

      const response = await fetcher.fetchLikes(getId(), pageable)

      const loadedUsers = await Promise.all(response.content.map(loadUserWithAvatar))
      const validUsers = loadedUsers.filter((u): u is LikeUser => u !== null) as T[]

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
      logger.error('Failed to fetch likes:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузить еще
   */
  async function loadMore(): Promise<T[]> {
    if (!hasMore.value || isLoading.value) return []
    return await fetch(page.value + 1)
  }

  /**
   * Сбросить состояние
   */
  function reset() {
    cleanup()
    page.value = 0
    totalElements.value = 0
    hasMore.value = true
    error.value = null
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  // Auto-fetch if immediate
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

