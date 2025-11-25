// src/composables/api/useUserProfile.ts
/**
 * useUserProfile - Composable для страницы профиля пользователя
 */

import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { usePinsStore } from '@/stores/pins.store'
import { useBoardsStore } from '@/stores/boards.store'
import type { User, PinWithBlob, BoardWithPins } from '@/types'

export interface UseUserProfileOptions {
  loadPins?: boolean
  loadBoards?: boolean
}

export function useUserProfile(
  username: string | (() => string),
  options: UseUserProfileOptions = {},
) {
  const { loadPins = true, loadBoards = true } = options

  const userStore = useUserStore()
  const subscriptionsStore = useSubscriptionsStore()
  const pinsStore = usePinsStore()
  const boardsStore = useBoardsStore()

  const getName = () => (typeof username === 'string' ? username : username())

  // ============ LOCAL STATE ============

  const userId = ref<string | null>(null)

  // ============ REACTIVE DATA ============

  const user = computed<User | null>(() => {
    if (!userId.value) return null
    return userStore.getUserById(userId.value) || null
  })

  const isCurrentUser = computed(() => userId.value === userStore.userId)

  const isFollowing = computed(() =>
    userId.value ? subscriptionsStore.isFollowingUser(userId.value) : false,
  )

  const avatarUrl = computed(() => (userId.value ? userStore.getAvatarUrl(userId.value) : null))

  /** Пины пользователя (из активного feed) */
  const pins = computed<PinWithBlob[]>(() => pinsStore.feedPins)

  /** Доски пользователя */
  const boards = computed<BoardWithPins[]>(() =>
    userId.value ? boardsStore.getUserBoards(userId.value) : [],
  )

  const followers = computed(() =>
    userId.value ? subscriptionsStore.getFollowers(userId.value) : [],
  )

  const following = computed(() =>
    userId.value ? subscriptionsStore.getFollowing(userId.value) : [],
  )

  // ============ LOADING STATES ============

  const isLoading = computed(() => userStore.isLoadingProfile)
  const isLoadingPins = computed(() => pinsStore.isLoading)
  const isLoadingBoards = computed(() => boardsStore.isLoading)

  // ============ ACTIONS ============

  async function fetchUser() {
    const fetchedUser = await userStore.loadUserByUsername(getName())
    userId.value = fetchedUser.id

    // Проверяем подписку если не текущий пользователь
    if (!isCurrentUser.value) {
      await subscriptionsStore.checkFollow(fetchedUser.id)
    }

    return fetchedUser
  }

  async function fetchPins(page = 0) {
    if (!userId.value) return []
    return await pinsStore.fetchPins({ authorId: userId.value }, page)
  }

  async function fetchBoards() {
    if (!userId.value) return []
    return await boardsStore.fetchUserBoards(userId.value)
  }

  async function fetchFollowers(page = 0) {
    if (!userId.value) return []
    return await subscriptionsStore.fetchFollowers(userId.value, page)
  }

  async function fetchFollowing(page = 0) {
    if (!userId.value) return []
    return await subscriptionsStore.fetchFollowing(userId.value, page)
  }

  async function fetchAll() {
    await fetchUser()

    const promises: Promise<unknown>[] = []

    if (loadPins) promises.push(fetchPins(0))
    if (loadBoards) promises.push(fetchBoards())

    await Promise.all(promises)
  }

  async function follow() {
    if (!userId.value) return
    await subscriptionsStore.followUser(userId.value)
  }

  async function unfollow() {
    if (!userId.value) return
    await subscriptionsStore.unfollowUser(userId.value)
  }

  async function toggleFollow() {
    if (isFollowing.value) {
      await unfollow()
    } else {
      await follow()
    }
  }

  function cleanup() {
    if (userId.value) {
      subscriptionsStore.clearUserCache(userId.value)
    }
    pinsStore.resetFeed()
  }

  onUnmounted(cleanup)

  return {
    // Data
    user,
    userId: computed(() => userId.value),
    isCurrentUser,
    isFollowing,
    avatarUrl,
    pins,
    boards,
    followers,
    following,

    // Loading
    isLoading,
    isLoadingPins,
    isLoadingBoards,

    // Actions
    fetchUser,
    fetchPins,
    fetchBoards,
    fetchFollowers,
    fetchFollowing,
    fetchAll,
    follow,
    unfollow,
    toggleFollow,
    cleanup,
  }
}

/**
 * useCurrentUser - Текущий пользователь
 */
export function useCurrentUser() {
  const userStore = useUserStore()

  const user = computed(() => userStore.currentUser)
  const userId = computed(() => userStore.userId)
  const username = computed(() => userStore.username)
  const avatarUrl = computed(() => userStore.avatarBlobUrl)
  const bannerUrl = computed(() => userStore.bannerBlobUrl)
  const isLoading = computed(() => userStore.isLoadingProfile)

  async function load() {
    return await userStore.loadCurrentUser()
  }

  async function updateProfile(data: Parameters<typeof userStore.updateProfile>[0]) {
    return await userStore.updateProfile(data)
  }

  async function uploadAvatar(file: File) {
    return await userStore.uploadAvatar(file)
  }

  async function uploadBanner(file: File) {
    return await userStore.uploadBanner(file)
  }

  return {
    user,
    userId,
    username,
    avatarUrl,
    bannerUrl,
    isLoading,
    load,
    updateProfile,
    uploadAvatar,
    uploadBanner,
  }
}
