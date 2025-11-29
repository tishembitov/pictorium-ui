// src/composables/api/useUserSearch.ts
/**
 * useUserSearch - Поиск пользователей с загрузкой аватаров
 * Использует useUsersWithAvatars для загрузки аватаров
 */

import { ref, computed } from 'vue'
import { usersApi } from '@/api'
import { useUsersWithAvatars } from './useUsersWithAvatars'
import type { User } from '@/types'

export interface UserSearchResult extends User {
  avatarBlobUrl?: string
}

export function useUserSearch() {
  const { loadUsers, getUser } = useUsersWithAvatars()

  // State
  const users = ref<UserSearchResult[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastQuery = ref('')

  // Computed
  const hasResults = computed(() => users.value.length > 0)
  const isEmpty = computed(
    () => !isLoading.value && users.value.length === 0 && lastQuery.value !== '',
  )

  /**
   * Поиск пользователей
   */
  async function search(query: string, limit = 20): Promise<UserSearchResult[]> {
    const trimmed = query.trim()

    if (!trimmed) {
      clear()
      return []
    }

    if (trimmed === lastQuery.value) {
      return users.value
    }

    lastQuery.value = trimmed
    isLoading.value = true
    error.value = null

    try {
      const response = await usersApi.searchUsers(trimmed, limit)

      // Загружаем аватары через useUsersWithAvatars
      const userIds = response.map((user) => user.id)
      await loadUsers(userIds)

      // Собираем результаты с аватарами
      const usersWithAvatars: UserSearchResult[] = response.map((user) => {
        const avatarData = getUser(user.id)
        return {
          ...user,
          avatarBlobUrl: avatarData.image || undefined,
        }
      })

      users.value = usersWithAvatars
      return usersWithAvatars
    } catch (err) {
      console.error('[useUserSearch] Search failed:', err)
      error.value = err instanceof Error ? err.message : 'Search failed'
      users.value = []
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Очистить результаты
   */
  function clear(): void {
    users.value = []
    lastQuery.value = ''
    error.value = null
  }

  return {
    // State
    users,
    isLoading,
    error,
    lastQuery,

    // Computed
    hasResults,
    isEmpty,

    // Methods
    search,
    clear,
  }
}
