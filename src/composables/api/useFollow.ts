// src/composables/api/useFollow.ts
/**
 * useFollow - Простой composable для follow/unfollow
 */

import { ref, computed, onUnmounted } from 'vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'

export function useFollow(userId: string | (() => string)) {
  const store = useSubscriptionsStore()

  const getId = () => (typeof userId === 'string' ? userId : userId())

  // ✅ ДОБАВЛЕНО: error state
  const error = ref<Error | null>(null)

  const isFollowing = computed(() => store.isFollowingUser(getId()))
  const isLoading = computed(() => store.isFollowing)

  async function check() {
    try {
      error.value = null
      return await store.checkFollow(getId())
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function follow() {
    try {
      error.value = null
      return await store.followUser(getId())
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function unfollow() {
    try {
      error.value = null
      return await store.unfollowUser(getId())
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function toggle() {
    if (isFollowing.value) {
      await unfollow()
    } else {
      await follow()
    }
  }

  // ✅ ДОБАВЛЕНО: cleanup
  function cleanup() {
    error.value = null
  }

  onUnmounted(cleanup)

  return {
    isFollowing,
    isLoading,
    error,
    check,
    follow,
    unfollow,
    toggle,
  }
}
