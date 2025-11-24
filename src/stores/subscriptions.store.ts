// src/stores/subscriptions.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { User } from '@/types'
import { subscriptionsApi } from '@/api'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  // ============ STATE ============

  const followersCache = reactive(new Map<string, User[]>())
  const followingCache = reactive(new Map<string, User[]>())
  const followersPagination = reactive(new Map<string, { page: number; hasMore: boolean }>())
  const followingPagination = reactive(new Map<string, { page: number; hasMore: boolean }>())
  const followStatusCache = reactive(new Map<string, boolean>())

  const isFollowing = ref(false)
  const isLoadingFollowers = ref(false)
  const isLoadingFollowing = ref(false)

  // ============ GETTERS ============

  const getFollowers = computed(() => (userId: string) => {
    return followersCache.get(userId) || []
  })

  const getFollowing = computed(() => (userId: string) => {
    return followingCache.get(userId) || []
  })

  const hasMoreFollowers = computed(() => (userId: string) => {
    return followersPagination.get(userId)?.hasMore ?? true
  })

  const hasMoreFollowing = computed(() => (userId: string) => {
    return followingPagination.get(userId)?.hasMore ?? true
  })

  const isFollowingUser = computed(() => (userId: string) => {
    return followStatusCache.get(userId) ?? false
  })

  // ============ ACTIONS ============

  async function fetchFollowers(userId: string, page = 0, size = 20, reset = false) {
    try {
      if (reset) {
        followersPagination.set(userId, { page: 0, hasMore: true })
      }

      isLoadingFollowers.value = true

      const response = await subscriptionsApi.getFollowers(userId, { page, size, sort: [] })

      if (page === 0 || reset) {
        followersCache.set(userId, response.content)
      } else {
        const existing = followersCache.get(userId) || []
        followersCache.set(userId, [...existing, ...response.content])
      }

      followersPagination.set(userId, {
        page: response.number,
        hasMore: !response.last,
      })

      return response.content
    } catch (error) {
      console.error('[Subscriptions] Failed to fetch followers:', error)
      throw error
    } finally {
      isLoadingFollowers.value = false
    }
  }

  async function fetchFollowing(userId: string, page = 0, size = 20, reset = false) {
    try {
      if (reset) {
        followingPagination.set(userId, { page: 0, hasMore: true })
      }

      isLoadingFollowing.value = true

      const response = await subscriptionsApi.getFollowing(userId, { page, size, sort: [] })

      if (page === 0 || reset) {
        followingCache.set(userId, response.content)
      } else {
        const existing = followingCache.get(userId) || []
        followingCache.set(userId, [...existing, ...response.content])
      }

      followingPagination.set(userId, {
        page: response.number,
        hasMore: !response.last,
      })

      return response.content
    } catch (error) {
      console.error('[Subscriptions] Failed to fetch following:', error)
      throw error
    } finally {
      isLoadingFollowing.value = false
    }
  }

  async function followUser(userId: string) {
    try {
      isFollowing.value = true
      followStatusCache.set(userId, true)

      await subscriptionsApi.followUser(userId)
    } catch (error) {
      console.error('[Subscriptions] Failed to follow user:', error)
      followStatusCache.set(userId, false)
      throw error
    } finally {
      isFollowing.value = false
    }
  }

  async function unfollowUser(userId: string) {
    try {
      isFollowing.value = true
      followStatusCache.set(userId, false)

      await subscriptionsApi.unfollowUser(userId)
    } catch (error) {
      console.error('[Subscriptions] Failed to unfollow user:', error)
      followStatusCache.set(userId, true)
      throw error
    } finally {
      isFollowing.value = false
    }
  }

  async function checkFollow(userId: string, forceReload = false) {
    try {
      if (!forceReload && followStatusCache.has(userId)) {
        return followStatusCache.get(userId)!
      }

      const response = await subscriptionsApi.checkFollow(userId)
      followStatusCache.set(userId, response.isFollowing)

      return response.isFollowing
    } catch (error) {
      console.error('[Subscriptions] Failed to check follow status:', error)
      throw error
    }
  }

  async function loadMoreFollowers(userId: string) {
    const pagination = followersPagination.get(userId)
    if (!pagination?.hasMore) return

    await fetchFollowers(userId, pagination.page + 1, 20, false)
  }

  async function loadMoreFollowing(userId: string) {
    const pagination = followingPagination.get(userId)
    if (!pagination?.hasMore) return

    await fetchFollowing(userId, pagination.page + 1, 20, false)
  }

  function clearUserCache(userId: string) {
    followersCache.delete(userId)
    followingCache.delete(userId)
    followersPagination.delete(userId)
    followingPagination.delete(userId)
  }

  function clearAll() {
    followersCache.clear()
    followingCache.clear()
    followersPagination.clear()
    followingPagination.clear()
    followStatusCache.clear()
  }

  return {
    followersCache,
    followingCache,
    followStatusCache,
    isFollowing,
    isLoadingFollowers,
    isLoadingFollowing,
    getFollowers,
    getFollowing,
    hasMoreFollowers,
    hasMoreFollowing,
    isFollowingUser,
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
