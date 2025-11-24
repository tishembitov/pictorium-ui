// src/stores/subscriptions.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Pageable } from '@/types'
import { subscriptionsApi } from '@/api/subscriptions.api'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  // ============ STATE ============

  // Подписчики пользователя (key: userId)
  const followersCache = ref<Map<string, User[]>>(new Map())

  // Подписки пользователя (key: userId)
  const followingCache = ref<Map<string, User[]>>(new Map())

  // Пагинация подписчиков (key: userId)
  const followersPagination = ref<Map<string, { page: number; hasMore: boolean }>>(new Map())

  // Пагинация подписок (key: userId)
  const followingPagination = ref<Map<string, { page: number; hasMore: boolean }>>(new Map())

  // Кэш проверок подписки (key: userId, value: isFollowing)
  const followStatusCache = ref<Map<string, boolean>>(new Map())

  // Loading states
  const isFollowing = ref(false)
  const isLoadingFollowers = ref(false)
  const isLoadingFollowing = ref(false)

  // ============ GETTERS ============

  const getFollowers = computed(() => (userId: string) => {
    return followersCache.value.get(userId) || []
  })

  const getFollowing = computed(() => (userId: string) => {
    return followingCache.value.get(userId) || []
  })

  const hasMoreFollowers = computed(() => (userId: string) => {
    return followersPagination.value.get(userId)?.hasMore ?? true
  })

  const hasMoreFollowing = computed(() => (userId: string) => {
    return followingPagination.value.get(userId)?.hasMore ?? true
  })

  const isFollowingUser = computed(() => (userId: string) => {
    return followStatusCache.value.get(userId) ?? false
  })

  // ============ ACTIONS ============

  /**
   * Загрузка подписчиков пользователя
   */
  async function fetchFollowers(userId: string, page = 0, size = 20, reset = false) {
    try {
      if (reset) {
        followersPagination.value.set(userId, { page: 0, hasMore: true })
      }

      isLoadingFollowers.value = true

      const response = await subscriptionsApi.getFollowers(userId, { page, size, sort: [] })

      if (page === 0 || reset) {
        followersCache.value.set(userId, response.content)
      } else {
        const existing = followersCache.value.get(userId) || []
        followersCache.value.set(userId, [...existing, ...response.content])
      }

      followersPagination.value.set(userId, {
        page: response.number,
        hasMore: !response.last,
      })

      return response.content
    } catch (error) {
      console.error('Failed to fetch followers:', error)
      throw error
    } finally {
      isLoadingFollowers.value = false
    }
  }

  /**
   * Загрузка подписок пользователя
   */
  async function fetchFollowing(userId: string, page = 0, size = 20, reset = false) {
    try {
      if (reset) {
        followingPagination.value.set(userId, { page: 0, hasMore: true })
      }

      isLoadingFollowing.value = true

      const response = await subscriptionsApi.getFollowing(userId, { page, size, sort: [] })

      if (page === 0 || reset) {
        followingCache.value.set(userId, response.content)
      } else {
        const existing = followingCache.value.get(userId) || []
        followingCache.value.set(userId, [...existing, ...response.content])
      }

      followingPagination.value.set(userId, {
        page: response.number,
        hasMore: !response.last,
      })

      return response.content
    } catch (error) {
      console.error('Failed to fetch following:', error)
      throw error
    } finally {
      isLoadingFollowing.value = false
    }
  }

  /**
   * Подписаться на пользователя
   */
  async function followUser(userId: string) {
    try {
      isFollowing.value = true

      // Оптимистичное обновление
      followStatusCache.value.set(userId, true)

      await subscriptionsApi.followUser(userId)

      // Можно обновить счетчики в auth store или user profile store
    } catch (error) {
      console.error('Failed to follow user:', error)
      // Откат
      followStatusCache.value.set(userId, false)
      throw error
    } finally {
      isFollowing.value = false
    }
  }

  /**
   * Отписаться от пользователя
   */
  async function unfollowUser(userId: string) {
    try {
      isFollowing.value = true

      // Оптимистичное обновление
      followStatusCache.value.set(userId, false)

      await subscriptionsApi.unfollowUser(userId)
    } catch (error) {
      console.error('Failed to unfollow user:', error)
      // Откат
      followStatusCache.value.set(userId, true)
      throw error
    } finally {
      isFollowing.value = false
    }
  }

  /**
   * Проверить подписку на пользователя
   */
  async function checkFollow(userId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && followStatusCache.value.has(userId)) {
        return followStatusCache.value.get(userId)!
      }

      const response = await subscriptionsApi.checkFollow(userId)
      followStatusCache.value.set(userId, response.isFollowing)

      return response.isFollowing
    } catch (error) {
      console.error('Failed to check follow status:', error)
      throw error
    }
  }

  /**
   * Загрузка следующей страницы подписчиков
   */
  async function loadMoreFollowers(userId: string) {
    const pagination = followersPagination.value.get(userId)
    if (!pagination || !pagination.hasMore) return

    await fetchFollowers(userId, pagination.page + 1, 20, false)
  }

  /**
   * Загрузка следующей страницы подписок
   */
  async function loadMoreFollowing(userId: string) {
    const pagination = followingPagination.value.get(userId)
    if (!pagination || !pagination.hasMore) return

    await fetchFollowing(userId, pagination.page + 1, 20, false)
  }

  /**
   * Очистить кэш пользователя
   */
  function clearUserCache(userId: string) {
    followersCache.value.delete(userId)
    followingCache.value.delete(userId)
    followersPagination.value.delete(userId)
    followingPagination.value.delete(userId)
  }

  /**
   * Очистить все
   */
  function clearAll() {
    followersCache.value.clear()
    followingCache.value.clear()
    followersPagination.value.clear()
    followingPagination.value.clear()
    followStatusCache.value.clear()
  }

  return {
    // State
    followersCache,
    followingCache,
    followStatusCache,
    isFollowing,
    isLoadingFollowers,
    isLoadingFollowing,

    // Getters
    getFollowers,
    getFollowing,
    hasMoreFollowers,
    hasMoreFollowing,
    isFollowingUser,

    // Actions
    fetchFollowers,
    fetchFollowing,
    followUser,
    unfollowUser,
    checkFollow,
    loadMoreFollowers,
    loadMoreFollowing,
    clearUserCache,
    clearAll,
  }
})
