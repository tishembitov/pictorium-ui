// src/composables/api/useUsersWithAvatars.ts
/**
 * useUsersWithAvatars - Загрузка пользователей с аватарами
 * Устраняет дублирование в CommentList и CommentReplies
 */

import { reactive, computed } from 'vue'
import { useUserStore } from '@/stores/user.store'

export interface UserWithAvatar {
  username: string
  image: string | null
}

export function useUsersWithAvatars() {
  const userStore = useUserStore()
  const cache = reactive(new Map<string, UserWithAvatar>())
  const loading = reactive(new Set<string>())

  const isLoading = computed(() => loading.size > 0)

  async function loadUser(userId: string): Promise<UserWithAvatar> {
    // Return cached
    if (cache.has(userId)) {
      return cache.get(userId)!
    }

    // Wait for existing request
    if (loading.has(userId)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (cache.has(userId)) {
            clearInterval(checkInterval)
            resolve(cache.get(userId)!)
          }
        }, 50)

        // Timeout after 5s
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve({ username: 'Unknown', image: null })
        }, 5000)
      })
    }

    loading.add(userId)

    try {
      const user = await userStore.loadUserById(userId)
      const avatar = userStore.getAvatarUrl(userId)
      const data: UserWithAvatar = {
        username: user.username,
        image: avatar || null,
      }
      cache.set(userId, data)
      return data
    } catch (error) {
      console.warn(`[useUsersWithAvatars] Failed to load user ${userId}:`, error)
      const fallback: UserWithAvatar = { username: 'Unknown', image: null }
      cache.set(userId, fallback)
      return fallback
    } finally {
      loading.delete(userId)
    }
  }

  async function loadUsers(userIds: string[]): Promise<void> {
    const unique = [...new Set(userIds)].filter((id) => !cache.has(id))
    if (unique.length === 0) return
    await Promise.all(unique.map(loadUser))
  }

  function getUser(userId: string): UserWithAvatar {
    return cache.get(userId) || { username: 'Loading...', image: null }
  }

  function hasUser(userId: string): boolean {
    return cache.has(userId)
  }

  function clear(): void {
    cache.clear()
    loading.clear()
  }

  return {
    cache,
    isLoading,
    loadUser,
    loadUsers,
    getUser,
    hasUser,
    clear,
  }
}
