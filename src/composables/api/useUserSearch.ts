// src/composables/api/useUserSearch.ts
/**
 * useUserSearch - Поиск пользователей с загрузкой аватаров
 * Использует useUsersWithAvatars для загрузки аватаров
 */

import { computed } from 'vue'
import { useUsersWithAvatars } from './useUsersWithAvatars'
import { useSearchBase } from './useSearchBase'
import type { User } from '@/types'

export interface UserSearchResult extends User {
  avatarBlobUrl?: string
}

export function useUserSearch() {
  const { loadUsers, getUser } = useUsersWithAvatars()

  const searchBase = useSearchBase<User>(
    {
      search: async (query: string, limit = 20): Promise<User[]> => {
      // NOTE: Search endpoint не существует в OpenAPI спецификации
      // Возвращаем пустой массив или можно реализовать поиск на клиенте
      const response: User[] = []

      // Загружаем аватары через useUsersWithAvatars
      const userIds = response.map((user: User) => user.id)
      await loadUsers(userIds)

        return response
      },
      clearResults: () => {
        // No-op для users
      },
    },
    { debounceDelay: 300 },
  )

  // Преобразуем результаты с аватарами
  const users = computed<UserSearchResult[]>(() => {
    return searchBase.results.value.map((user: User) => {
        const avatarData = getUser(user.id)
        return {
          ...user,
          avatarBlobUrl: avatarData.image || undefined,
        }
      })
  })

  return {
    // State
    users,
    isLoading: searchBase.isSearching,
    error: computed(() => {
      const err = searchBase.error.value
      return err ? (err instanceof Error ? err.message : 'Search failed') : null
    }),
    lastQuery: searchBase.lastQuery,

    // Computed
    hasResults: searchBase.hasResults,
    isEmpty: searchBase.isEmpty,

    // Methods
    search: searchBase.search,
    clear: searchBase.clear,
  }
}
