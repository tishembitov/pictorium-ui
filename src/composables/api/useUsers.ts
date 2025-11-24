/**
 * useUsers Composable (Refactored)
 */

import { ref, computed } from 'vue'
import { usersApi } from '@/api/users.api'
import { subscriptionsApi } from '@/api/subscriptions.api'
import { useApiCall } from '@/composables/core/useApiCall'
import { useLoadMore } from '@/composables/core/useLoadMore'
import type { User } from '@/types'

/**
 * useUsers - Работа с пользователями
 */
export function useUsers() {
  const user = ref<User | null>(null)

  // Fetch User by Username
  const { execute: fetchUserByUsername, isLoading } = useApiCall(
    async (username: string) => {
      const fetchedUser = await usersApi.getUserByUsername(username)
      user.value = fetchedUser
      return fetchedUser
    },
    { showErrorToast: true, errorMessage: 'Failed to load user' },
  )

  // Fetch User by ID
  const { execute: fetchUserById } = useApiCall(
    async (userId: string) => {
      const fetchedUser = await usersApi.getUserById(userId)
      user.value = fetchedUser
      return fetchedUser
    },
    { showErrorToast: true, errorMessage: 'Failed to load user' },
  )

  // Follow User
  const { execute: followUser } = useApiCall(
    (userId: string) => subscriptionsApi.followUser(userId),
    { showSuccessToast: true, successMessage: 'Followed!', showErrorToast: true },
  )

  // Unfollow User
  const { execute: unfollowUser } = useApiCall(
    (userId: string) => subscriptionsApi.unfollowUser(userId),
    { showSuccessToast: true, successMessage: 'Unfollowed!', showErrorToast: true },
  )

  // Check Follow
  const { execute: checkFollow } = useApiCall(
    async (userId: string) => {
      const response = await subscriptionsApi.checkFollow(userId)
      return response.isFollowing
    },
    { showErrorToast: false },
  )

  return {
    user: computed(() => user.value),
    isLoading,
    fetchUserByUsername: async (username: string) => (await fetchUserByUsername(username))!,
    fetchUserById: async (userId: string) => (await fetchUserById(userId))!,
    followUser: async (userId: string) => {
      await followUser(userId)
    },
    unfollowUser: async (userId: string) => {
      await unfollowUser(userId)
    },
    checkFollow: async (userId: string) => (await checkFollow(userId)) || false,
  }
}

/**
 * useFollow - Follow/Unfollow для конкретного пользователя
 */
export function useFollow(userId: string | (() => string)) {
  const { followUser, unfollowUser, checkFollow } = useUsers()
  const isFollowing = ref(false)
  const isLoading = ref(false)

  const getId = () => (typeof userId === 'string' ? userId : userId())

  const check = async () => {
    isFollowing.value = await checkFollow(getId())
  }

  const follow = async () => {
    isLoading.value = true
    try {
      await followUser(getId())
      isFollowing.value = true
    } finally {
      isLoading.value = false
    }
  }

  const unfollow = async () => {
    isLoading.value = true
    try {
      await unfollowUser(getId())
      isFollowing.value = false
    } finally {
      isLoading.value = false
    }
  }

  const toggle = async () => {
    if (isFollowing.value) {
      await unfollow()
    } else {
      await follow()
    }
  }

  return {
    isFollowing: computed(() => isFollowing.value),
    isLoading: computed(() => isLoading.value),
    follow,
    unfollow,
    toggle,
    check,
  }
}

/**
 * useUserFollowers - Подписчики пользователя
 */
export function useUserFollowers(userId: string | (() => string)) {
  const getId = () => (typeof userId === 'string' ? userId : userId())

  const {
    items: followers,
    isLoading,
    hasMore,
    load,
    loadMore,
  } = useLoadMore({
    fetchFn: (page, size) => subscriptionsApi.getFollowers(getId(), { page, size, sort: [] }),
    pageSize: 20,
  })

  return {
    followers,
    isLoading,
    hasMore,
    load,
    loadMore,
  }
}

/**
 * useUserFollowing - Подписки пользователя
 */
export function useUserFollowing(userId: string | (() => string)) {
  const getId = () => (typeof userId === 'string' ? userId : userId())

  const {
    items: following,
    isLoading,
    hasMore,
    load,
    loadMore,
  } = useLoadMore({
    fetchFn: (page, size) => subscriptionsApi.getFollowing(getId(), { page, size, sort: [] }),
    pageSize: 20,
  })

  return {
    following,
    isLoading,
    hasMore,
    load,
    loadMore,
  }
}

/**
 * useUserProfile - Для страницы профиля
 */
export function useUserProfile(username: string | (() => string)) {
  const { user, isLoading, fetchUserByUsername } = useUsers()

  const getName = () => (typeof username === 'string' ? username : username())

  const fetchUser = async () => {
    await fetchUserByUsername(getName())
  }

  return {
    user,
    isLoading,
    fetchUser,
  }
}
