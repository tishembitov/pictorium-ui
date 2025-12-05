// src/stores/comments.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Comment, CommentWithBlob } from '@/types'
import { commentsApi, likesApi, storageApi } from '@/api'

export const useCommentsStore = defineStore('comments', () => {
  // ============ STATE ============

  const pinCommentsCache = reactive(new Map<string, CommentWithBlob[]>())
  const repliesCache = reactive(new Map<string, CommentWithBlob[]>())
  const commentsById = reactive(new Map<string, CommentWithBlob>())
  const paginationCache = reactive(new Map<string, { page: number; hasMore: boolean }>())
  const repliesPaginationCache = reactive(new Map<string, { page: number; hasMore: boolean }>())
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

  // ✅ ДОБАВЛЕНО: геттер для pagination info
  const getRepliesPagination = computed(() => (commentId: string) => {
    return repliesPaginationCache.get(commentId) || { page: 0, hasMore: true }
  })

  // ============ ACTIONS ============

  async function fetchPinComments(pinId: string, page = 0, size = 20, reset = false) {
    try {
      if (reset) {
        paginationCache.set(pinId, { page: 0, hasMore: true })
      }

      isLoading.value = page === 0

      const response = await commentsApi.getComments(pinId, {
        pinId,
        pageable: { page, size, sort: ['createdAt,desc'] },
      })

      const commentsWithBlobs = await loadCommentsBlobs(response.content)

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

  async function loadMoreComments(pinId: string) {
    const pagination = paginationCache.get(pinId)
    if (!pagination?.hasMore) return []

    return await fetchPinComments(pinId, pagination.page + 1, 20, false)
  }

  async function createComment(pinId: string, content?: string, imageFile?: File) {
    try {
      let imageUrl: string | undefined

      let imageId: string | undefined

      if (imageFile) {
        const uploadResponse = await storageApi.uploadImage(imageFile, {
          category: 'comments',
        })
        imageId = uploadResponse.imageId
      }

      const comment = await commentsApi.createComment(pinId, {
        content,
        imageId,
      })

      const commentWithBlob = await loadCommentBlob(comment)

      commentsById.set(commentWithBlob.id, commentWithBlob)

      const existing = pinCommentsCache.get(pinId) || []
      pinCommentsCache.set(pinId, [commentWithBlob, ...existing])

      return commentWithBlob
    } catch (error) {
      console.error('[Comments] Failed to create comment:', error)
      throw error
    }
  }

  async function updateComment(commentId: string, content?: string, imageFile?: File) {
    try {
      let imageId: string | undefined

      if (imageFile) {
        const uploadResponse = await storageApi.uploadImage(imageFile, {
          category: 'comments',
        })
        imageId = uploadResponse.imageId
      }

      const updated = await commentsApi.update(commentId, {
        content,
        imageId,
      })

      updateCommentInCache(commentId, updated)

      return updated
    } catch (error) {
      console.error('[Comments] Failed to update comment:', error)
      throw error
    }
  }

  async function deleteComment(commentId: string, pinId: string) {
    try {
      await commentsApi.delete(commentId)

      const cached = commentsById.get(commentId)
      if (cached?.imageBlobUrl) {
        URL.revokeObjectURL(cached.imageBlobUrl)
      }

      commentsById.delete(commentId)

      const comments = pinCommentsCache.get(pinId) || []
      pinCommentsCache.set(
        pinId,
        comments.filter((c) => c.id !== commentId),
      )

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

  async function fetchReplies(commentId: string, page = 0, size = 10, reset = false) {
    try {
      if (reset) {
        repliesPaginationCache.set(commentId, { page: 0, hasMore: true })
      }

      isLoadingReplies.set(commentId, true)

      const response = await commentsApi.getReplies(commentId, {
        commentId,
        pageable: { page, size, sort: ['createdAt,asc'] },
      })

      const repliesWithBlobs = await loadCommentsBlobs(response.content)

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

  // ✅ ДОБАВЛЕНО: loadMoreReplies метод
  async function loadMoreReplies(commentId: string) {
    const pagination = repliesPaginationCache.get(commentId)
    if (!pagination?.hasMore) return []

    return await fetchReplies(commentId, pagination.page + 1, 10, false)
  }

  async function createReply(commentId: string, content?: string, imageFile?: File) {
    try {
      let imageId: string | undefined

      if (imageFile) {
        const uploadResponse = await storageApi.uploadImage(imageFile, {
          category: 'comments',
        })
        imageId = uploadResponse.imageId
      }

      const reply = await commentsApi.createReply(commentId, {
        content,
        imageId,
      })

      const replyWithBlob = await loadCommentBlob(reply)

      commentsById.set(replyWithBlob.id, replyWithBlob)

      const existing = repliesCache.get(commentId) || []
      repliesCache.set(commentId, [...existing, replyWithBlob])

      updateCommentReplyCount(commentId, 1)

      return replyWithBlob
    } catch (error) {
      console.error('[Comments] Failed to create reply:', error)
      throw error
    }
  }

  async function likeComment(commentId: string) {
    try {
      updateCommentLikeStatus(commentId, true, 1)
      await likesApi.likeComment(commentId)
    } catch (error) {
      console.error('[Comments] Failed to like comment:', error)
      updateCommentLikeStatus(commentId, false, -1)
      throw error
    }
  }

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

  function clearAll() {
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

  async function loadCommentBlob(comment: Comment): Promise<CommentWithBlob> {
    if (!comment.imageId) return comment

    try {
      const blob = await storageApi.downloadImage(comment.imageId)
      return {
        ...comment,
        imageBlobUrl: URL.createObjectURL(blob),
      }
    } catch (error) {
      console.error(`[Comments] Failed to load image for comment ${comment.id}:`, error)
      return comment
    }
  }

  async function loadCommentsBlobs(comments: Comment[]): Promise<CommentWithBlob[]> {
    return Promise.all(comments.map(loadCommentBlob))
  }

  function updateCommentInCache(commentId: string, updates: Partial<Comment>) {
    const cached = commentsById.get(commentId)
    if (!cached) return

    const updated = { ...cached, ...updates }
    commentsById.set(commentId, updated)

    pinCommentsCache.forEach((comments) => {
      const index = comments.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments[index] = updated
      }
    })

    repliesCache.forEach((replies) => {
      const index = replies.findIndex((r) => r.id === commentId)
      if (index !== -1) {
        replies[index] = updated
      }
    })
  }

  function updateCommentLikeStatus(commentId: string, isLiked: boolean, delta: number) {
    const comment = commentsById.get(commentId)
    if (!comment) return

    updateCommentInCache(commentId, {
      isLiked,
      likeCount: Math.max(0, comment.likeCount + delta),
    })
  }

  function updateCommentReplyCount(commentId: string, delta: number) {
    const comment = commentsById.get(commentId)
    if (!comment) return

    updateCommentInCache(commentId, {
      replyCount: Math.max(0, comment.replyCount + delta),
    })
  }

  return {
    // State (exposed for debugging, prefer using getters)
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
    getRepliesPagination, // ✅ ДОБАВЛЕНО

    // Actions
    fetchPinComments,
    loadMoreComments,
    createComment,
    updateComment,
    deleteComment,
    fetchReplies,
    loadMoreReplies, // ✅ ДОБАВЛЕНО
    createReply,
    likeComment,
    unlikeComment,
    clearPinComments,
    clearAll,
  }
})
