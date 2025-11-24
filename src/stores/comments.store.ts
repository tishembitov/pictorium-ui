// src/stores/comments.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Comment, Pageable } from '@/types'
import { commentsApi } from '@/api/comments.api'
import { likesApi } from '@/api/likes.api'
import { storageApi } from '@/api/storage.api'

interface CommentWithBlob extends Comment {
  imageBlobUrl?: string
}

export const useCommentsStore = defineStore('comments', () => {
  // ============ STATE ============

  // Комментарии по pinId (key: pinId, value: comments[])
  const pinCommentsCache = ref<Map<string, CommentWithBlob[]>>(new Map())

  // Ответы на комментарии (key: commentId, value: replies[])
  const repliesCache = ref<Map<string, CommentWithBlob[]>>(new Map())

  // Пагинация комментариев пина (key: pinId)
  const paginationCache = ref<Map<string, { page: number; hasMore: boolean }>>(new Map())

  // Пагинация ответов (key: commentId)
  const repliesPaginationCache = ref<Map<string, { page: number; hasMore: boolean }>>(new Map())

  // Loading states
  const isLoading = ref(false)
  const isLoadingReplies = ref<Map<string, boolean>>(new Map())

  // ============ GETTERS ============

  const getPinComments = computed(() => (pinId: string) => {
    return pinCommentsCache.value.get(pinId) || []
  })

  const getCommentReplies = computed(() => (commentId: string) => {
    return repliesCache.value.get(commentId) || []
  })

  const hasMoreComments = computed(() => (pinId: string) => {
    return paginationCache.value.get(pinId)?.hasMore ?? true
  })

  const hasMoreReplies = computed(() => (commentId: string) => {
    return repliesPaginationCache.value.get(commentId)?.hasMore ?? true
  })

  // ============ ACTIONS ============

  /**
   * Загрузка комментариев пина
   */
  async function fetchPinComments(pinId: string, page = 0, size = 20, reset = false) {
    try {
      if (reset) {
        paginationCache.value.set(pinId, { page: 0, hasMore: true })
      }

      isLoading.value = page === 0

      const response = await commentsApi.getComments(pinId, {
        pageable: { page, size, sort: ['createdAt,desc'] },
      })

      const commentsWithBlobs = await loadCommentsBlobs(response.content)

      if (page === 0 || reset) {
        pinCommentsCache.value.set(pinId, commentsWithBlobs)
      } else {
        const existing = pinCommentsCache.value.get(pinId) || []
        pinCommentsCache.value.set(pinId, [...existing, ...commentsWithBlobs])
      }

      paginationCache.value.set(pinId, {
        page: response.number,
        hasMore: !response.last,
      })

      return commentsWithBlobs
    } catch (error) {
      console.error('Failed to fetch pin comments:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузка следующей страницы комментариев
   */
  async function loadMoreComments(pinId: string) {
    const pagination = paginationCache.value.get(pinId)
    if (!pagination || !pagination.hasMore) return

    await fetchPinComments(pinId, pagination.page + 1, 20, false)
  }

  /**
   * Создание комментария
   */
  async function createComment(pinId: string, content?: string, imageFile?: File) {
    try {
      let imageUrl: string | undefined

      // Загружаем изображение если есть
      if (imageFile) {
        const uploadResponse = await storageApi.uploadImage({
          file: imageFile,
          category: 'comments',
        })
        imageUrl = uploadResponse.imageUrl
      }

      const comment = await commentsApi.createComment(pinId, {
        content,
        imageUrl,
      })

      const commentWithBlob = await loadCommentBlob(comment)

      // Добавляем в начало списка
      const existing = pinCommentsCache.value.get(pinId) || []
      pinCommentsCache.value.set(pinId, [commentWithBlob, ...existing])

      return commentWithBlob
    } catch (error) {
      console.error('Failed to create comment:', error)
      throw error
    }
  }

  /**
   * Обновление комментария
   */
  async function updateComment(commentId: string, content?: string, imageFile?: File) {
    try {
      let imageUrl: string | undefined

      if (imageFile) {
        const uploadResponse = await storageApi.uploadImage({
          file: imageFile,
          category: 'comments',
        })
        imageUrl = uploadResponse.imageUrl
      }

      const updated = await commentsApi.update(commentId, {
        content,
        imageUrl,
      })

      // Обновляем в кэше
      updateCommentInCache(commentId, updated)

      return updated
    } catch (error) {
      console.error('Failed to update comment:', error)
      throw error
    }
  }

  /**
   * Удаление комментария
   */
  async function deleteComment(commentId: string, pinId: string) {
    try {
      await commentsApi.delete(commentId)

      // Удаляем из кэша
      const comments = pinCommentsCache.value.get(pinId) || []
      pinCommentsCache.value.set(
        pinId,
        comments.filter((c) => c.id !== commentId),
      )

      // Удаляем ответы
      repliesCache.value.delete(commentId)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      throw error
    }
  }

  /**
   * Загрузка ответов на комментарий
   */
  async function fetchReplies(commentId: string, page = 0, size = 10, reset = false) {
    try {
      if (reset) {
        repliesPaginationCache.value.set(commentId, { page: 0, hasMore: true })
      }

      isLoadingReplies.value.set(commentId, true)

      const response = await commentsApi.getReplies(commentId, {
        pageable: { page, size, sort: ['createdAt,asc'] },
      })

      const repliesWithBlobs = await loadCommentsBlobs(response.content)

      if (page === 0 || reset) {
        repliesCache.value.set(commentId, repliesWithBlobs)
      } else {
        const existing = repliesCache.value.get(commentId) || []
        repliesCache.value.set(commentId, [...existing, ...repliesWithBlobs])
      }

      repliesPaginationCache.value.set(commentId, {
        page: response.number,
        hasMore: !response.last,
      })

      return repliesWithBlobs
    } catch (error) {
      console.error('Failed to fetch replies:', error)
      throw error
    } finally {
      isLoadingReplies.value.set(commentId, false)
    }
  }

  /**
   * Создание ответа
   */
  async function createReply(commentId: string, content?: string, imageFile?: File) {
    try {
      let imageUrl: string | undefined

      if (imageFile) {
        const uploadResponse = await storageApi.uploadImage({
          file: imageFile,
          category: 'comments',
        })
        imageUrl = uploadResponse.imageUrl
      }

      const reply = await commentsApi.createReply(commentId, {
        content,
        imageUrl,
      })

      const replyWithBlob = await loadCommentBlob(reply)

      // Добавляем в конец списка ответов
      const existing = repliesCache.value.get(commentId) || []
      repliesCache.value.set(commentId, [...existing, replyWithBlob])

      // Обновляем счетчик ответов в родительском комментарии
      updateCommentReplyCount(commentId, 1)

      return replyWithBlob
    } catch (error) {
      console.error('Failed to create reply:', error)
      throw error
    }
  }

  /**
   * Лайк комментария
   */
  async function likeComment(commentId: string) {
    try {
      await likesApi.likeComment(commentId)

      // Оптимистичное обновление
      updateCommentLikeStatus(commentId, true, 1)
    } catch (error) {
      console.error('Failed to like comment:', error)
      // Откат
      updateCommentLikeStatus(commentId, false, -1)
      throw error
    }
  }

  /**
   * Убрать лайк с комментария
   */
  async function unlikeComment(commentId: string) {
    try {
      await likesApi.unlikeComment(commentId)

      updateCommentLikeStatus(commentId, false, -1)
    } catch (error) {
      console.error('Failed to unlike comment:', error)
      updateCommentLikeStatus(commentId, true, 1)
      throw error
    }
  }

  /**
   * Очистить комментарии пина
   */
  function clearPinComments(pinId: string) {
    pinCommentsCache.value.delete(pinId)
    paginationCache.value.delete(pinId)
  }

  /**
   * Очистить все
   */
  function clearAll() {
    // Cleanup blob URLs
    pinCommentsCache.value.forEach((comments) => {
      comments.forEach((comment) => {
        if (comment.imageBlobUrl) {
          URL.revokeObjectURL(comment.imageBlobUrl)
        }
      })
    })

    repliesCache.value.forEach((replies) => {
      replies.forEach((reply) => {
        if (reply.imageBlobUrl) {
          URL.revokeObjectURL(reply.imageBlobUrl)
        }
      })
    })

    pinCommentsCache.value.clear()
    repliesCache.value.clear()
    paginationCache.value.clear()
    repliesPaginationCache.value.clear()
  }

  // ============ HELPERS ============

  /**
   * Загрузка blob URL для комментария
   */
  async function loadCommentBlob(comment: Comment): Promise<CommentWithBlob> {
    if (!comment.imageUrl) return comment

    try {
      const blob = await storageApi.downloadImage(comment.imageUrl)
      return {
        ...comment,
        imageBlobUrl: URL.createObjectURL(blob),
      }
    } catch (error) {
      console.error(`Failed to load image for comment ${comment.id}:`, error)
      return comment
    }
  }

  /**
   * Загрузка blob URLs для массива комментариев
   */
  async function loadCommentsBlobs(comments: Comment[]): Promise<CommentWithBlob[]> {
    return Promise.all(comments.map(loadCommentBlob))
  }

  /**
   * Обновление комментария в кэше
   */
  function updateCommentInCache(commentId: string, updates: Partial<Comment>) {
    // Обновляем в pinCommentsCache
    pinCommentsCache.value.forEach((comments, pinId) => {
      const index = comments.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments[index] = { ...comments[index], ...updates }
      }
    })

    // Обновляем в repliesCache
    repliesCache.value.forEach((replies, parentId) => {
      const index = replies.findIndex((r) => r.id === commentId)
      if (index !== -1) {
        replies[index] = { ...replies[index], ...updates }
      }
    })
  }

  /**
   * Обновление статуса лайка
   */
  function updateCommentLikeStatus(commentId: string, isLiked: boolean, delta: number) {
    updateCommentInCache(commentId, {
      isLiked,
      likeCount: Math.max(0, (getCommentById(commentId)?.likeCount || 0) + delta),
    })
  }

  /**
   * Обновление счетчика ответов
   */
  function updateCommentReplyCount(commentId: string, delta: number) {
    updateCommentInCache(commentId, {
      replyCount: Math.max(0, (getCommentById(commentId)?.replyCount || 0) + delta),
    })
  }

  /**
   * Получить комментарий по ID
   */
  function getCommentById(commentId: string): CommentWithBlob | null {
    // Ищем в pinCommentsCache
    for (const comments of pinCommentsCache.value.values()) {
      const comment = comments.find((c) => c.id === commentId)
      if (comment) return comment
    }

    // Ищем в repliesCache
    for (const replies of repliesCache.value.values()) {
      const reply = replies.find((r) => r.id === commentId)
      if (reply) return reply
    }

    return null
  }

  return {
    // State
    pinCommentsCache,
    repliesCache,
    isLoading,
    isLoadingReplies,

    // Getters
    getPinComments,
    getCommentReplies,
    hasMoreComments,
    hasMoreReplies,

    // Actions
    fetchPinComments,
    loadMoreComments,
    createComment,
    updateComment,
    deleteComment,
    fetchReplies,
    createReply,
    likeComment,
    unlikeComment,
    clearPinComments,
    clearAll,
  }
})
