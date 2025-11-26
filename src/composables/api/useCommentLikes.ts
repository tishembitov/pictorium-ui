// src/composables/api/useCommentLikes.ts
/**
 * useCommentLikes - Загрузка пользователей, лайкнувших комментарий
 */

import { ref, computed, onUnmounted } from 'vue'
import { likesApi, usersApi, storageApi } from '@/api'
import type { User, Pageable } from '@/types'

export interface CommentLikeUser extends User {
  avatarBlobUrl?: string
  likedAt?: string
}

export interface UseCommentLikesOptions {
  pageSize?: number
  immediate?: boolean
}

export function useCommentLikes(
  commentId: string | (() => string),
  options: UseCommentLikesOptions = {},
) {
  const { pageSize = 5, immediate = false } = options

  const getId = () => (typeof commentId === 'string' ? commentId : commentId())

  // State
  const users = ref<CommentLikeUser[]>([])
  const page = ref(0)
  const totalElements = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Load user with avatar
  async function loadUserWithAvatar(userId: string): Promise<CommentLikeUser | null> {
    try {
      const user = await usersApi.getUserById(userId)
      const likeUser: CommentLikeUser = { ...user }

      if (user.imageUrl) {
        try {
          const blob = await storageApi.downloadImage(user.imageUrl)
          likeUser.avatarBlobUrl = URL.createObjectURL(blob)
        } catch (e) {
          console.warn(`[useCommentLikes] Failed to load avatar for user ${user.id}:`, e)
        }
      }

      return likeUser
    } catch (e) {
      console.error(`[useCommentLikes] Failed to load user ${userId}:`, e)
      return null
    }
  }

  // Fetch likes
  async function fetch(pageNum = 0, reset = false): Promise<CommentLikeUser[]> {
    if (isLoading.value) return []

    try {
      isLoading.value = true
      error.value = null

      if (reset) {
        cleanup()
        page.value = 0
        hasMore.value = true
      }

      const pageable: Pageable = {
        page: pageNum,
        size: pageSize,
        sort: ['createdAt,desc'],
      }

      const response = await likesApi.getCommentLikes(getId(), {
        commentId: getId(),
        pageable,
      })

      // Load users for each like
      const loadedUsers = await Promise.all(
        response.content.map((like) => loadUserWithAvatar(like.userId)),
      )

      const validUsers = loadedUsers.filter((u): u is CommentLikeUser => u !== null)

      if (pageNum === 0 || reset) {
        users.value = validUsers
      } else {
        users.value.push(...validUsers)
      }

      page.value = response.number
      totalElements.value = response.totalElements
      hasMore.value = !response.last

      return validUsers
    } catch (e) {
      error.value = e as Error
      console.error('[useCommentLikes] Failed to fetch likes:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Load more
  async function loadMore(): Promise<CommentLikeUser[]> {
    if (!hasMore.value || isLoading.value) return []
    return await fetch(page.value + 1)
  }

  // Cleanup blob URLs
  function cleanup() {
    users.value.forEach((user) => {
      if (user.avatarBlobUrl) {
        URL.revokeObjectURL(user.avatarBlobUrl)
      }
    })
    users.value = []
  }

  // Reset
  function reset() {
    cleanup()
    page.value = 0
    totalElements.value = 0
    hasMore.value = true
    error.value = null
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  // Immediate fetch
  if (immediate) {
    fetch(0)
  }

  return {
    users: computed(() => users.value),
    isLoading: computed(() => isLoading.value),
    hasMore: computed(() => hasMore.value),
    error: computed(() => error.value),
    totalElements: computed(() => totalElements.value),
    fetch,
    loadMore,
    reset,
  }
}
