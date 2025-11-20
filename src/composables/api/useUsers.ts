/**
 * useUsers Composable
 *
 * Composable для работы с пользователями
 */

import { computed, ref, type Ref } from 'vue'
import { usersApi } from '@/api/users.api'
import { subscriptionsApi } from '@/api/subscriptions.api'
import type { User, Pageable } from '@/types'
import { useToast } from '@/composables/ui/useToast'

export interface UseUsersReturn {
  user: Ref<User | null>
  followers: Ref<User[]>
  following: Ref<User[]>
  isLoading: Ref<boolean>

  fetchUserByUsername: (username: string) => Promise<User>
  fetchUserById: (userId: string) => Promise<User>
  followUser: (userId: string) => Promise<void>
  unfollowUser: (userId: string) => Promise<void>
  checkFollow: (userId: string) => Promise<boolean>
  fetchFollowers: (userId: string, page?: number, size?: number) => Promise<User[]>
  fetchFollowing: (userId: string, page?: number, size?: number) => Promise<User[]>
}

/**
 * useUsers
 *
 * @example
 * ```ts
 * const {
 *   user,
 *   fetchUserByUsername,
 *   followUser
 * } = useUsers()
 *
 * // Загрузка пользователя
 * const user = await fetchUserByUsername('john_doe')
 *
 * // Подписка
 * await followUser(user.id)
 * ```
 */
export function useUsers(): UseUsersReturn {
  const { showToast } = useToast()

  const user = ref<User | null>(null)
  const followers = ref<User[]>([])
  const following = ref<User[]>([])
  const isLoading = ref(false)

  const fetchUserByUsername = async (username: string): Promise<User> => {
    try {
      isLoading.value = true
      const fetchedUser = await usersApi.getUserByUsername(username)
      user.value = fetchedUser
      return fetchedUser
    } catch (error) {
      console.error('[useUsers] Fetch user by username failed:', error)
      showToast('Failed to load user', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserById = async (userId: string): Promise<User> => {
    try {
      isLoading.value = true
      const fetchedUser = await usersApi.getUserById(userId)
      user.value = fetchedUser
      return fetchedUser
    } catch (error) {
      console.error('[useUsers] Fetch user by ID failed:', error)
      showToast('Failed to load user', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const followUser = async (userId: string): Promise<void> => {
    try {
      await subscriptionsApi.followUser(userId)
      showToast('Followed!', 'success')
    } catch (error) {
      console.error('[useUsers] Follow user failed:', error)
      showToast('Failed to follow user', 'error')
      throw error
    }
  }

  const unfollowUser = async (userId: string): Promise<void> => {
    try {
      await subscriptionsApi.unfollowUser(userId)
      showToast('Unfollowed!', 'success')
    } catch (error) {
      console.error('[useUsers] Unfollow user failed:', error)
      showToast('Failed to unfollow user', 'error')
      throw error
    }
  }

  const checkFollow = async (userId: string): Promise<boolean> => {
    try {
      const response = await subscriptionsApi.checkFollow(userId)
      return response.isFollowing
    } catch (error) {
      console.error('[useUsers] Check follow failed:', error)
      return false
    }
  }

  const fetchFollowers = async (userId: string, page = 0, size = 20): Promise<User[]> => {
    try {
      const response = await subscriptionsApi.getFollowers(userId, { page, size, sort: [] })
      followers.value = response.content
      return response.content
    } catch (error) {
      console.error('[useUsers] Fetch followers failed:', error)
      showToast('Failed to load followers', 'error')
      throw error
    }
  }

  const fetchFollowing = async (userId: string, page = 0, size = 20): Promise<User[]> => {
    try {
      const response = await subscriptionsApi.getFollowing(userId, { page, size, sort: [] })
      following.value = response.content
      return response.content
    } catch (error) {
      console.error('[useUsers] Fetch following failed:', error)
      showToast('Failed to load following', 'error')
      throw error
    }
  }

  return {
    user,
    followers,
    following,
    isLoading,
    fetchUserByUsername,
    fetchUserById,
    followUser,
    unfollowUser,
    checkFollow,
    fetchFollowers,
    fetchFollowing,
  }
}

/**
 * useFollow
 *
 * Для кнопки Follow/Unfollow
 *
 * @example
 * ```ts
 * const { isFollowing, isLoading, toggle, check } = useFollow(userId)
 *
 * await check()
 * await toggle()
 * ```
 */
export function useFollow(userId: Ref<string> | string) {
  const { followUser, unfollowUser, checkFollow } = useUsers()

  const isFollowing = ref(false)
  const isLoading = ref(false)

  const id = computed(() => (typeof userId === 'string' ? userId : userId.value))

  const check = async () => {
    try {
      isFollowing.value = await checkFollow(id.value)
    } catch (error) {
      console.error('[useFollow] Check follow failed:', error)
    }
  }

  const follow = async () => {
    try {
      isLoading.value = true
      await followUser(id.value)
      isFollowing.value = true
    } finally {
      isLoading.value = false
    }
  }

  const unfollow = async () => {
    try {
      isLoading.value = true
      await unfollowUser(id.value)
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
    isFollowing,
    isLoading,
    follow,
    unfollow,
    toggle,
    check,
  }
}

/**
 * useUserProfile
 *
 * Для страницы профиля пользователя
 *
 * @example
 * ```ts
 * const { user, isLoading, fetchUser } = useUserProfile(username)
 *
 * await fetchUser()
 * ```
 */
export function useUserProfile(username: Ref<string> | string) {
  const { fetchUserByUsername, user, isLoading } = useUsers()

  const name = computed(() => (typeof username === 'string' ? username : username.value))

  const fetchUser = async () => {
    await fetchUserByUsername(name.value)
  }

  return {
    user,
    isLoading,
    fetchUser,
  }
}
