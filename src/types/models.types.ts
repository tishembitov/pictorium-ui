// src/types/models.types.ts

// ============================================================================
// USER MODELS
// ============================================================================

export interface User {
  id: string
  username: string
  email: string
  imageId: string | null
  bannerImageId: string | null
  description: string | null
  instagram: string | null
  tiktok: string | null
  telegram: string | null
  pinterest: string | null
}

export interface UserStats {
  followersCount: number
  followingCount: number
  pinsCount: number
  boardsCount: number
}

// ============================================================================
// PIN MODELS
// ============================================================================

export interface Pin {
  id: string
  userId: string
  title: string | null
  description: string | null
  href: string | null
  imageId: string
  thumbnailId: string | null
  videoPreviewId: string | null
  createdAt: string
  updatedAt: string
  tags: string[]
  isLiked: boolean
  isSaved: boolean
  saveCount: number
  commentCount: number
  likeCount: number
  viewCount: number
}

/**
 * Pin с загруженными blob URLs (для UI)
 */
export interface PinWithBlob extends Pin {
  imageUrl?: string | null
  thumbnailUrl?: string | null
  videoPreviewUrl?: string | null
  imageBlobUrl?: string
  videoBlobUrl?: string
  isImage?: boolean
  isVideo?: boolean
  isGif?: boolean
  rgb?: string | null
  width?: number | null
  height?: number | null
  fileSize?: number | null
  contentType?: string | null
}

/**
 * Упрощенный Pin для превью (используется в досках)
 */
export interface PinPreview {
  id: string
  imageId: string
  thumbnailId: string | null
  videoPreviewId: string | null
}

export interface PinFeed {
  pins: PinWithBlob[]
  page: number
  totalPages: number
  totalElements: number
  hasMore: boolean
  isLoading: boolean
}

export enum PinScope {
  ALL = 'ALL',
  CREATED = 'CREATED',
  SAVED = 'SAVED',
  LIKED = 'LIKED',
  RELATED = 'RELATED',
}

export interface PinFilter {
  q?: string
  tags?: string[]
  authorId?: string
  savedBy?: string
  likedBy?: string
  relatedTo?: string
  createdFrom?: string
  createdTo?: string
  scope?: PinScope | `${PinScope}`
}

// ============================================================================
// BOARD MODELS
// ============================================================================

export interface Board {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

/**
 * Board с превью пинов
 */
export interface BoardWithPins extends Board {
  pins?: PinWithBlob[]
  pinsCount?: number
}

// ============================================================================
// COMMENT MODELS
// ============================================================================

export interface Comment {
  id: string
  pinId: string
  userId: string
  parentCommentId: string | null
  content: string | null
  imageId: string | null
  isLiked: boolean
  likeCount: number
  replyCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Comment с загруженным blob URL
 */
export interface CommentWithBlob extends Comment {
  imageUrl?: string | null
  imageBlobUrl?: string
}

// ============================================================================
// LIKE MODELS
// ============================================================================

export interface Like {
  id: string
  userId: string
  pinId: string | null
  commentId: string | null
  createdAt: string
}

// ============================================================================
// TAG MODELS
// ============================================================================

export interface Tag {
  id: string
  name: string
}

/**
 * Категория с превью пина
 */
export interface Category {
  tagId: string
  tagName: string
  pin: PinPreview
}

// ============================================================================
// SUBSCRIPTION MODELS
// ============================================================================

export interface Subscription {
  status: string
}

export interface FollowCheckResponse {
  isFollowing: boolean
}

// ============================================================================
// IMAGE/STORAGE MODELS
// ============================================================================

export interface ImageMetadata {
  imageId: string
  fileName: string
  contentType: string
  size: number
  etag: string
  updatedAt: string
  bucketName: string
}

export interface PresignedUploadRequest {
  fileName: string
  contentType: string
  fileSize: number
  category?: string
  generateThumbnail?: boolean
  thumbnailWidth?: number
  thumbnailHeight?: number
}

export interface PresignedUploadResponse {
  imageId: string
  uploadUrl: string
  expiresAt: number
  requiredHeaders: Record<string, string>
  thumbnailImageId?: string
}

export interface ConfirmUploadRequest {
  imageId: string
  thumbnailImageId?: string
  fileName?: string
  contentType?: string
  fileSize?: number
}

export interface ConfirmUploadResponse {
  imageId: string
  imageUrl: string
  thumbnailUrl: string | null
  fileName: string
  size: number
  contentType: string
  updatedAt: string
  confirmed: boolean
}

export interface ImageUrlResponse {
  imageId: string
  url: string
  expiresAt: number
}

// ============================================================================
// PAGINATION MODELS
// ============================================================================

export interface Pageable {
  page: number
  size: number
  sort?: string[]
}

export interface SortObject {
  empty: boolean
  sorted: boolean
  unsorted: boolean
}

export interface PageableObject {
  offset: number
  sort: SortObject
  pageNumber: number
  pageSize: number
  paged: boolean
  unpaged: boolean
}

/**
 * Generic Page response
 */
export interface Page<T> {
  totalPages: number
  totalElements: number
  size: number
  content: T[]
  number: number
  sort: SortObject
  first: boolean
  last: boolean
  numberOfElements: number
  pageable: PageableObject
  empty: boolean
}

// ============================================================================
// TYPE ALIASES (для удобства)
// ============================================================================

export type PageUser = Page<User>
export type PagePin = Page<Pin>
export type PageComment = Page<Comment>
export type PageLike = Page<Like>
export type PageTag = Page<Tag>
export type PageBoard = Page<Board>
