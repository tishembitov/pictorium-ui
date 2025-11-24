// src/stores/comments.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Comment, CommentWithBlob, Pageable } from '@/types'
import { commentsApi } from '@/api/comments.api'
import { likesApi } from '@/api/likes.api'
import { storageApi } from '@/api/storage.api'

export const useCommentsStore = defineStore('comments', () => {
  // ============ STATE ============

  // Комментарии по pinId (key: pinId, value: comments[])
  const pinCommentsCache = reactive(new Map<string, CommentWithBlob[]>())

  // Ответы на комментарии (key: commentId, value: replies[])
  const repliesCache = reactive(new Map<string, CommentWithBlob[]>())

  // Кэш комментариев по ID для быстрого поиска O(1)
  const commentsById = reactive(new Map<string, CommentWithBlob>())

  // Пагинация комментариев пина (key: pinId)
  const paginationCache = reactive(new Map<string, { page: number; hasMore: boolean }>())

  // Пагинация ответов (key: commentId)
  const repliesPaginationCache = reactive(new Map<string, { page: number; hasMore: boolean }>())

  // Loading states
  const isLoading = ref(false)
  const isLoadingReplies = reactive(new Map<string, boolean>())

  // ============ GETTERS ============

  const getPinComments = computed(() => (pinId: string) => {
    return pinCommentsCache.get(pinId) || []
  })

  const getCommentReplies = computed(() => (commentId: string) => {
    return repliesCache.get(commentId) || []
  })

  const hasMoreComments = computed(() => (pinId: string) => {
    return paginationCache.get(pinId)?.hasMore ?? true
  })

  const hasMoreReplies = computed(() => (commentId: string) => {
    return repliesPaginationCache.get(commentId)?.hasMore ?? true
  })

  const getCommentById = computed(() => (commentId: string) => {
    return commentsById.get(commentId) || null
  })

  // ============ ACTIONS ============

  /**
   * Загрузка комментариев пина
   */
  async function fetchPinComments(pinId: string, page = 0, size = 20, reset = false) {
    try {
      if (reset) {
        paginationCache.set(pinId, { page: 0, hasMore: true })
      }

      isLoading.value = page === 0

      const response = await commentsApi.getComments(pinId, {
        pageable: { page, size, sort: ['createdAt,desc'] },
      })

      const commentsWithBlobs = await loadCommentsBlobs(response.content)

      // Кэшируем по ID
      commentsWithBlobs.forEach((comment) => {
        commentsById.set(comment.id, comment)
      })

      if (page === 0 || reset) {
        pinCommentsCache.set(pinId, commentsWithBlobs)
      } else {
        const existing = pinCommentsCache.get(pinId) || []
        pinCommentsCache.set(pinId, [...existing, ...commentsWithBlobs])
      }

      paginationCache.set(pinId, {
        page: response.number,
        hasMore: !response.last,
      })

      return commentsWithBlobs
    } catch (error) {
      console.error('[Comments] Failed to fetch pin comments:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузка следующей страницы комментариев
   */
  async function loadMoreComments(pinId: string) {
    const pagination = paginationCache.get(pinId)
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

      // Кэшируем по ID
      commentsById.set(commentWithBlob.id, commentWithBlob)

      // Добавляем в начало списка
      const existing = pinCommentsCache.get(pinId) || []
      pinCommentsCache.set(pinId, [commentWithBlob, ...existing])

      return commentWithBlob
    } catch (error) {
      console.error('[Comments] Failed to create comment:', error)
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
      console.error('[Comments] Failed to update comment:', error)
      throw error
    }
  }

  /**
   * Удаление комментария
   */
  async function deleteComment(commentId: string, pinId: string) {
    try {
      await commentsApi.delete(commentId)

      // Очищаем blob URL
      const cached = commentsById.get(commentId)
      if (cached?.imageBlobUrl) {
        URL.revokeObjectURL(cached.imageBlobUrl)
      }

      // Удаляем из кэша по ID
      commentsById.delete(commentId)

      // Удаляем из списка комментариев пина
      const comments = pinCommentsCache.get(pinId) || []
      pinCommentsCache.set(
        pinId,
        comments.filter((c) => c.id !== commentId),
      )

      // Удаляем ответы
      const replies = repliesCache.get(commentId)
      if (replies) {
        replies.forEach((reply) => {
          if (reply.imageBlobUrl) {
            URL.revokeObjectURL(reply.imageBlobUrl)
          }
          commentsById.delete(reply.id)
        })
        repliesCache.delete(commentId)
      }
    } catch (error) {
      console.error('[Comments] Failed to delete comment:', error)
      throw error
    }
  }

  /**
   * Загрузка ответов на комментарий
   */
  async function fetchReplies(commentId: string, page = 0, size = 10, reset = false) {
    try {
      if (reset) {
        repliesPaginationCache.set(commentId, { page: 0, hasMore: true })
      }

      isLoadingReplies.set(commentId, true)

      const response = await commentsApi.getReplies(commentId, {
        pageable: { page, size, sort: ['createdAt,asc'] },
      })

      const repliesWithBlobs = await loadCommentsBlobs(response.content)

      // Кэшируем по ID
      repliesWithBlobs.forEach((reply) => {
        commentsById.set(reply.id, reply)
      })

      if (page === 0 || reset) {
        repliesCache.set(commentId, repliesWithBlobs)
      } else {
        const existing = repliesCache.get(commentId) || []
        repliesCache.set(commentId, [...existing, ...repliesWithBlobs])
      }

      repliesPaginationCache.set(commentId, {
        page: response.number,
        hasMore: !response.last,
      })

      return repliesWithBlobs
    } catch (error) {
      console.error('[Comments] Failed to fetch replies:', error)
      throw error
    } finally {
      isLoadingReplies.set(commentId, false)
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

      // Кэшируем по ID
      commentsById.set(replyWithBlob.id, replyWithBlob)

      // Добавляем в конец списка ответов
      const existing = repliesCache.get(commentId) || []
      repliesCache.set(commentId, [...existing, replyWithBlob])

      // Обновляем счетчик ответов в родительском комментарии
      updateCommentReplyCount(commentId, 1)

      return replyWithBlob
    } catch (error) {
      console.error('[Comments] Failed to create reply:', error)
      throw error
    }
  }

  /**
   * Лайк комментария
   */
  async function likeComment(commentId: string) {
    try {
      // Оптимистичное обновление
      updateCommentLikeStatus(commentId, true, 1)

      await likesApi.likeComment(commentId)
    } catch (error) {
      console.error('[Comments] Failed to like comment:', error)
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
      updateCommentLikeStatus(commentId, false, -1)

      await likesApi.unlikeComment(commentId)
    } catch (error) {
      console.error('[Comments] Failed to unlike comment:', error)
      updateCommentLikeStatus(commentId, true, 1)
      throw error
    }
  }

  /**
   * Очистить комментарии пина
   */
  function clearPinComments(pinId: string) {
    const comments = pinCommentsCache.get(pinId)
    if (comments) {
      comments.forEach((comment) => {
        if (comment.imageBlobUrl) {
          URL.revokeObjectURL(comment.imageBlobUrl)
        }
        commentsById.delete(comment.id)
      })
    }

    pinCommentsCache.delete(pinId)
    paginationCache.delete(pinId)
  }

  /**
   * Очистить все
   */
  function clearAll() {
    // Cleanup blob URLs
    commentsById.forEach((comment) => {
      if (comment.imageBlobUrl) {
        URL.revokeObjectURL(comment.imageBlobUrl)
      }
    })

    pinCommentsCache.clear()
    repliesCache.clear()
    commentsById.clear()
    paginationCache.clear()
    repliesPaginationCache.clear()
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
      console.error(`[Comments] Failed to load image for comment ${comment.id}:`, error)
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
    const cached = commentsById.get(commentId)
    if (!cached) return

    const updated = { ...cached, ...updates }
    commentsById.set(commentId, updated)

    // Обновляем в pinCommentsCache
    pinCommentsCache.forEach((comments) => {
      const index = comments.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments[index] = updated
      }
    })

    // Обновляем в repliesCache
    repliesCache.forEach((replies) => {
      const index = replies.findIndex((r) => r.id === commentId)
      if (index !== -1) {
        replies[index] = updated
      }
    })
  }

  /**
   * Обновление статуса лайка
   */
  function updateCommentLikeStatus(commentId: string, isLiked: boolean, delta: number) {
    const comment = commentsById.get(commentId)
    if (!comment) return

    updateCommentInCache(commentId, {
      isLiked,
      likeCount: Math.max(0, comment.likeCount + delta),
    })
  }

  /**
   * Обновление счетчика ответов
   */
  function updateCommentReplyCount(commentId: string, delta: number) {
    const comment = commentsById.get(commentId)
    if (!comment) return

    updateCommentInCache(commentId, {
      replyCount: Math.max(0, comment.replyCount + delta),
    })
  }

  return {
    // State
    pinCommentsCache,
    repliesCache,
    commentsById,
    isLoading,
    isLoadingReplies,

    // Getters
    getPinComments,
    getCommentReplies,
    getCommentById,
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
