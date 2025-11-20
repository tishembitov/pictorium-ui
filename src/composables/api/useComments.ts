/**
 * useComments Composable
 *
 * Composable для работы с комментариями
 */

import { computed, ref, type Ref } from 'vue'
import { commentsApi } from '@/api/comments.api'
import type { Comment, CommentCreateRequest, CommentUpdateRequest, Pageable } from '@/types'
import { useToast } from '@/composables/ui/useToast'

export interface UseCommentsReturn {
  comments: Ref<Comment[]>
  isLoading: Ref<boolean>
  hasMore: Ref<boolean>
  currentPage: Ref<number>
  totalElements: Ref<number>

  fetchComments: (pinId: string, page?: number, size?: number) => Promise<void>
  createComment: (pinId: string, data: CommentCreateRequest) => Promise<Comment>
  updateComment: (commentId: string, data: CommentUpdateRequest) => Promise<Comment>
  deleteComment: (commentId: string) => Promise<void>
  fetchReplies: (commentId: string, page?: number, size?: number) => Promise<Comment[]>
  createReply: (commentId: string, data: CommentCreateRequest) => Promise<Comment>
  loadMore: () => Promise<void>
  reset: () => void
}

/**
 * useComments
 *
 * @example
 * ```ts
 * const {
 *   comments,
 *   isLoading,
 *   fetchComments,
 *   createComment
 * } = useComments()
 *
 * // Загрузка комментариев
 * await fetchComments(pinId)
 *
 * // Создание комментария
 * await createComment(pinId, { content: 'Nice pin!' })
 * ```
 */
export function useComments(): UseCommentsReturn {
  const { showToast } = useToast()

  const comments = ref<Comment[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(0)
  const totalElements = ref(0)

  let currentPinId: string | null = null

  const fetchComments = async (pinId: string, page = 0, size = 10): Promise<void> => {
    try {
      isLoading.value = true
      currentPinId = pinId

      const response = await commentsApi.getComments(pinId, {
        pageable: { page, size, sort: ['createdAt,desc'] },
        pinId: pinId,
      })

      if (page === 0) {
        comments.value = response.content
      } else {
        comments.value.push(...response.content)
      }

      currentPage.value = page
      totalElements.value = response.totalElements
      hasMore.value = !response.last
    } catch (error) {
      console.error('[useComments] Fetch comments failed:', error)
      showToast('Failed to load comments', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const createComment = async (pinId: string, data: CommentCreateRequest): Promise<Comment> => {
    try {
      const comment = await commentsApi.createComment(pinId, data)
      comments.value.unshift(comment)
      totalElements.value += 1
      showToast('Comment added!', 'success')
      return comment
    } catch (error) {
      console.error('[useComments] Create comment failed:', error)
      showToast('Failed to add comment', 'error')
      throw error
    }
  }

  const updateComment = async (commentId: string, data: CommentUpdateRequest): Promise<Comment> => {
    try {
      const updated = await commentsApi.update(commentId, data)

      const index = comments.value.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = updated
      }

      showToast('Comment updated!', 'success')
      return updated
    } catch (error) {
      console.error('[useComments] Update comment failed:', error)
      showToast('Failed to update comment', 'error')
      throw error
    }
  }

  const deleteComment = async (commentId: string): Promise<void> => {
    try {
      await commentsApi.delete(commentId)

      comments.value = comments.value.filter((c) => c.id !== commentId)
      totalElements.value = Math.max(0, totalElements.value - 1)

      showToast('Comment deleted!', 'success')
    } catch (error) {
      console.error('[useComments] Delete comment failed:', error)
      showToast('Failed to delete comment', 'error')
      throw error
    }
  }

  const fetchReplies = async (commentId: string, page = 0, size = 5): Promise<Comment[]> => {
    try {
      const response = await commentsApi.getReplies(commentId, {
        pageable: { page, size, sort: ['createdAt,asc'] },
        commentId: commentId,
      })

      return response.content
    } catch (error) {
      console.error('[useComments] Fetch replies failed:', error)
      showToast('Failed to load replies', 'error')
      throw error
    }
  }

  const createReply = async (commentId: string, data: CommentCreateRequest): Promise<Comment> => {
    try {
      const reply = await commentsApi.createReply(commentId, data)
      showToast('Reply added!', 'success')
      return reply
    } catch (error) {
      console.error('[useComments] Create reply failed:', error)
      showToast('Failed to add reply', 'error')
      throw error
    }
  }

  const loadMore = async (): Promise<void> => {
    if (!hasMore.value || !currentPinId) return
    await fetchComments(currentPinId, currentPage.value + 1)
  }

  const reset = (): void => {
    comments.value = []
    currentPage.value = 0
    totalElements.value = 0
    hasMore.value = true
    currentPinId = null
  }

  return {
    comments,
    isLoading,
    hasMore,
    currentPage,
    totalElements,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    fetchReplies,
    createReply,
    loadMore,
    reset,
  }
}

/**
 * useCommentReplies
 *
 * Для работы с ответами на комментарий
 *
 * @example
 * ```ts
 * const {
 *   replies,
 *   isLoading,
 *   fetchReplies,
 *   addReply
 * } = useCommentReplies(commentId)
 *
 * await fetchReplies()
 * await addReply({ content: 'Great!' })
 * ```
 */
export function useCommentReplies(commentId: Ref<string> | string) {
  const { fetchReplies, createReply } = useComments()

  const replies = ref<Comment[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(0)

  const id = computed(() => (typeof commentId === 'string' ? commentId : commentId.value))

  const fetch = async (page = 0, size = 5) => {
    try {
      isLoading.value = true
      const newReplies = await fetchReplies(id.value, page, size)

      if (page === 0) {
        replies.value = newReplies
      } else {
        replies.value.push(...newReplies)
      }

      currentPage.value = page
      hasMore.value = newReplies.length === size
    } finally {
      isLoading.value = false
    }
  }

  const addReply = async (data: CommentCreateRequest) => {
    const reply = await createReply(id.value, data)
    replies.value.push(reply)
    return reply
  }

  const loadMore = async () => {
    if (!hasMore.value) return
    await fetch(currentPage.value + 1)
  }

  return {
    replies,
    isLoading,
    hasMore,
    fetchReplies: fetch,
    addReply,
    loadMore,
  }
}
