/**
 * Типы для composables
 */

import type { Ref } from 'vue'
import type { User, Comment } from './models.types'

// ============================================================================
// useAuth
// ============================================================================

export interface UseAuthReturn {
  user: Ref<User | null>
  isAuthenticated: Ref<boolean>
  isLoading: Ref<boolean>
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

// ============================================================================
// useMedia
// ============================================================================

export interface UseMediaReturn {
  uploadImage: (file: File, options?: UploadImageOptions) => Promise<string>
  uploadVideo: (file: File) => Promise<string>
  isUploading: Ref<boolean>
  progress: Ref<number>
  error: Ref<string | null>
}

export interface UploadImageOptions {
  category?: string
  generateThumbnail?: boolean
  thumbnailWidth?: number
  thumbnailHeight?: number
}

// ============================================================================
// useInfiniteScroll
// ============================================================================

export interface UseInfiniteScrollOptions {
  distance?: number
  disabled?: Ref<boolean>
}

export interface UseInfiniteScrollReturn {
  containerRef: Ref<HTMLElement | null>
  isLoading: Ref<boolean>
  loadMore: () => Promise<void>
}

// ============================================================================
// useLikes
// ============================================================================

export interface UseLikesReturn {
  likePin: (pinId: string) => Promise<void>
  unlikePin: (pinId: string) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
  unlikeComment: (commentId: string) => Promise<void>
  isLiking: Ref<boolean>
}

// ============================================================================
// useComments
// ============================================================================

export interface UseCommentsReturn {
  comments: Ref<Comment[]>
  isLoading: Ref<boolean>
  hasMore: Ref<boolean>
  createComment: (pinId: string, content: string, imageUrl?: string) => Promise<void>
  loadMore: () => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
}

// ============================================================================
// useFollow
// ============================================================================

export interface UseFollowReturn {
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
  checkFollow: (userId: string) => Promise<boolean>
  isFollowing: Ref<boolean>
  isLoading: Ref<boolean>
}

// ============================================================================
// useFileUpload
// ============================================================================

export interface UseFileUploadOptions {
  accept?: string
  maxSize?: number
  onUpload?: (file: File) => Promise<string>
}

export interface UseFileUploadReturn {
  file: Ref<File | null>
  preview: Ref<string | null>
  isUploading: Ref<boolean>
  progress: Ref<number>
  error: Ref<string | null>
  selectFile: () => void
  upload: () => Promise<string | null>
  reset: () => void
}
