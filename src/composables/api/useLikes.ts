/**
 * useLikes Composable
 *
 * Composable для работы с лайками (пины + комментарии)
 */

import { computed, ref, type Ref } from 'vue'
import { likesApi } from '@/api/likes.api'
import type { Like, User, Pageable } from '@/types'
import { useToast } from '@/composables/ui/useToast'

export interface UseLikesReturn {
  // Pin Likes
  likePinAction: (pinId: string) => Promise<void>
  unlikePinAction: (pinId: string) => Promise<void>
  fetchPinLikes: (pinId: string, page?: number, size?: number) => Promise<User[]>

  // Comment Likes
  likeCommentAction: (commentId: string) => Promise<void>
  unlikeCommentAction: (commentId: string) => Promise<void>
  fetchCommentLikes: (commentId: string, page?: number, size?: number) => Promise<User[]>
}

/**
 * useLikes
 *
 * @example
 * ```ts
 * const { likePinAction, unlikePinAction } = useLikes()
 *
 * // Лайк пина
 * await likePinAction(pinId)
 *
 * // Убрать лайк
 * await unlikePinAction(pinId)
 * ```
 */
export function useLikes(): UseLikesReturn {
  const { showToast } = useToast()

  // Pin Likes
  const likePinAction = async (pinId: string): Promise<void> => {
    try {
      await likesApi.likePin(pinId)
    } catch (error) {
      console.error('[useLikes] Like pin failed:', error)
      showToast('Failed to like pin', 'error')
      throw error
    }
  }

  const unlikePinAction = async (pinId: string): Promise<void> => {
    try {
      await likesApi.unlikePin(pinId)
    } catch (error) {
      console.error('[useLikes] Unlike pin failed:', error)
      showToast('Failed to unlike pin', 'error')
      throw error
    }
  }

  const fetchPinLikes = async (pinId: string, page = 0, size = 20): Promise<User[]> => {
    try {
      const response = await likesApi.getPinLikes(pinId, {
        pageable: { page, size, sort: ['createdAt,desc'] },
        pinId: pinId,
      })

      // Extract users from likes (если Like содержит user)
      // В вашем случае нужно доработать API response
      return [] // TODO: extract users from response
    } catch (error) {
      console.error('[useLikes] Fetch pin likes failed:', error)
      showToast('Failed to load likes', 'error')
      throw error
    }
  }

  // Comment Likes
  const likeCommentAction = async (commentId: string): Promise<void> => {
    try {
      await likesApi.likeComment(commentId)
    } catch (error) {
      console.error('[useLikes] Like comment failed:', error)
      showToast('Failed to like comment', 'error')
      throw error
    }
  }

  const unlikeCommentAction = async (commentId: string): Promise<void> => {
    try {
      await likesApi.unlikeComment(commentId)
    } catch (error) {
      console.error('[useLikes] Unlike comment failed:', error)
      showToast('Failed to unlike comment', 'error')
      throw error
    }
  }

  const fetchCommentLikes = async (commentId: string, page = 0, size = 20): Promise<User[]> => {
    try {
      const response = await likesApi.getCommentLikes(commentId, {
        pageable: { page, size, sort: ['createdAt,desc'] },
        commentId: commentId,
      })

      return [] // TODO: extract users from response
    } catch (error) {
      console.error('[useLikes] Fetch comment likes failed:', error)
      showToast('Failed to load likes', 'error')
      throw error
    }
  }

  return {
    likePinAction,
    unlikePinAction,
    fetchPinLikes,
    likeCommentAction,
    unlikeCommentAction,
    fetchCommentLikes,
  }
}

/**
 * usePinLikes
 *
 * Для модалки лайков пина
 *
 * @example
 * ```ts
 * const { likes, isLoading, fetchLikes } = usePinLikes(pinId)
 *
 * await fetchLikes()
 * ```
 */
export function usePinLikes(pinId: Ref<string> | string) {
  const { fetchPinLikes } = useLikes()

  const likes = ref<User[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(0)

  const id = computed(() => (typeof pinId === 'string' ? pinId : pinId.value))

  const fetchLikes = async (page = 0, size = 20) => {
    try {
      isLoading.value = true
      const newLikes = await fetchPinLikes(id.value, page, size)

      if (page === 0) {
        likes.value = newLikes
      } else {
        likes.value.push(...newLikes)
      }

      currentPage.value = page
      hasMore.value = newLikes.length === size
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMore.value) return
    await fetchLikes(currentPage.value + 1)
  }

  return {
    likes,
    isLoading,
    hasMore,
    fetchLikes,
    loadMore,
  }
}

/**
 * useCommentLikes
 *
 * Для popover лайков комментария
 */
export function useCommentLikes(commentId: Ref<string> | string) {
  const { fetchCommentLikes } = useLikes()

  const likes = ref<User[]>([])
  const isLoading = ref(false)

  const id = computed(() => (typeof commentId === 'string' ? commentId : commentId.value))

  const fetchLikes = async (size = 10) => {
    try {
      isLoading.value = true
      likes.value = await fetchCommentLikes(id.value, 0, size)
    } finally {
      isLoading.value = false
    }
  }

  return {
    likes,
    isLoading,
    fetchLikes,
  }
}
