// src/composables/api/useFollow.ts
/**
 * useFollow - Простой composable для follow/unfollow
 */

import { ref, computed } from 'vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'

export function useFollow(userId: string | (() => string)) {
  const store = useSubscriptionsStore()

  const getId = () => (typeof userId === 'string' ? userId : userId())

  const isFollowing = computed(() => store.isFollowingUser(getId()))
  const isLoading = computed(() => store.isFollowing)

  async function check() {
    return await store.checkFollow(getId())
  }

  async function follow() {
    return await store.followUser(getId())
  }

  async function unfollow() {
    return await store.unfollowUser(getId())
  }

  async function toggle() {
    if (isFollowing.value) {
      await unfollow()
    } else {
      await follow()
    }
  }

  return {
    isFollowing,
    isLoading,
    check,
    follow,
    unfollow,
    toggle,
  }
}
