/**
 * Модели данных приложения
 */

// ============================================================================
// USER MODELS
// ============================================================================

export interface User {
  id: string
  username: string
  email: string
  imageUrl: string | null
  bannerImageUrl: string | null
  description: string | null
  instagram: string | null
  tiktok: string | null
  telegram: string | null
  pinterest: string | null
  selectedBoardId: string | null
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

// ============================================================================
// PIN MODELS
// ============================================================================

export interface Pin {
  id: string
  userId: string
  title: string | null
  description: string | null
  href: string | null
  imageUrl: string | null // Теперь может быть null
  thumbnailUrl: string | null // ДОБАВЛЕНО
  videoPreviewUrl: string | null
  rgb: string | null
  width: number | null // ДОБАВЛЕНО
  height: number | null // ИЗМЕНЕНО на number
  fileSize: number | null // ДОБАВЛЕНО
  contentType: string | null // ДОБАВЛЕНО
  createdAt: string
  updatedAt: string
  tags: string[]
  isLiked: boolean
  isSaved: boolean
  saveCount: number
  commentCount: number
  likeCount: number
  viewCount: number // ДОБАВЛЕНО
}

export interface PinPreview {
  id: string
  imageUrl: string
  videoPreviewUrl: string | null
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
  tags?: Set<string> // Исправлено с string[] на Set<string>
  authorId?: string
  savedBy?: string
  likedBy?: string
  relatedTo?: string
  createdFrom?: string
  createdTo?: string
  scope?: PinScope | string
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

// ============================================================================
// COMMENT MODELS
// ============================================================================

export interface Comment {
  id: string
  pinId: string
  userId: string
  parentCommentId: string | null
  content: string
  imageUrl: string | null
  isLiked: boolean
  likeCount: number
  replyCount: number
  createdAt: string
  updatedAt: string
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
  lastModified: number
  bucketName: string
}

export interface ImageUploadResponse {
  imageId: string
  imageUrl: string
  thumbnailUrl: string | null
  fileName: string
  size: number
  contentType: string
  uploadTimestamp: number
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

export type PageUser = Page<User>
export type PagePin = Page<Pin>
export type PageComment = Page<Comment>
export type PageLike = Page<Like>
export type PageTag = Page<Tag>
