// src/types/api.types.ts

/**
 * API Request/Response типы
 *
 * NOTE: Убраны type aliases типа PinResponse = Pin,
 * так как они избыточны. Используйте напрямую Pin, Board и т.д.
 */

import type {
  User,
  Pin,
  Board,
  Comment,
  Tag,
  Category,
  Subscription,
  FollowCheckResponse,
  ImageUploadResponse,
  ImageMetadata,
  PageUser,
  PagePin,
  PageComment,
  PageLike,
  PageTag,
  Pageable,
  PinFilter,
  Like,
  Page,
} from './models.types'

// ============================================================================
// USER API
// ============================================================================

export interface UserUpdateRequest {
  username?: string
  description?: string
  imageId?: string | null
  imageUrl?: string | null
  bannerImageId?: string | null
  bannerImageUrl?: string | null
  instagram?: string
  tiktok?: string
  telegram?: string
  pinterest?: string
}

export type GetCurrentUserResponse = User
export type GetUserByUsernameResponse = User
export type GetUserByIdResponse = User
export type UpdateUserResponse = User

// ============================================================================
// SUBSCRIPTION API
// ============================================================================

export type FollowUserResponse = Subscription
export type GetFollowersResponse = PageUser
export type GetFollowingResponse = PageUser
export type CheckFollowResponse = FollowCheckResponse

// ============================================================================
// PIN API
// ============================================================================

export interface PinCreateRequest {
  imageId: string // REQUIRED
  imageUrl?: string
  thumbnailId?: string
  thumbnailUrl?: string
  videoPreviewId?: string
  videoPreviewUrl?: string
  title?: string
  description?: string
  href?: string
  rgb?: string
  width?: number
  height?: number
  fileSize?: number
  contentType?: string
  tags?: string[]
}

export interface PinUpdateRequest {
  title?: string
  description?: string
  href?: string
  tags?: string[]
}

export type CreatePinResponse = Pin
export type GetPinsResponse = PagePin
export type GetPinByIdResponse = Pin
export type UpdatePinResponse = Pin

// ============================================================================
// BOARD API
// ============================================================================

export interface BoardCreateRequest {
  title: string
}

export interface CreateBoardResponse {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export type GetBoardResponse = Board
export type GetBoardPinsResponse = PagePin
export type GetUserBoardsResponse = Board[]
export type GetMyBoardsResponse = Board[]
export type GetSelectedBoardResponse = Board

// ============================================================================
// COMMENT API
// ============================================================================

export interface CommentCreateRequest {
  content?: string
  imageId?: string
  imageUrl?: string
}

export interface CommentUpdateRequest {
  content?: string
  imageId?: string
  imageUrl?: string
}

export interface GetCommentsParams {
  pinId: string
  pageable: Pageable
}

export interface GetRepliesParams {
  commentId: string
  pageable: Pageable
}

export type GetCommentsResponse = PageComment
export type CreateCommentResponse = Comment
export type GetCommentResponse = Comment
export type UpdateCommentResponse = Comment
export type GetRepliesResponse = PageComment
export type CreateReplyResponse = Comment

// ============================================================================
// LIKE API
// ============================================================================

export interface GetPinLikesParams {
  pinId: string
  pageable: Pageable
}

export interface GetCommentLikesParams {
  commentId: string
  pageable: Pageable
}

export type LikePinResponse = Pin
export type GetPinLikesResponse = PageLike
export type LikeCommentResponse = Comment
export type GetCommentLikesResponse = PageLike

// ============================================================================
// SAVED PIN API
// ============================================================================

export type SavePinResponse = Pin

// ============================================================================
// TAG API
// ============================================================================

export interface GetAllTagsParams {
  pageable: Pageable
}

export interface SearchTagsParams {
  q: string
  limit?: number
}

export interface GetCategoriesParams {
  limit?: number
}

export type GetAllTagsResponse = PageTag
export type GetTagByIdResponse = Tag
export type SearchTagsResponse = Tag[]
export type GetPinTagsResponse = Tag[]
export type GetCategoriesResponse = Category[]

// ============================================================================
// STORAGE/IMAGE API
// ============================================================================

export interface ImageUploadRequest {
  file: File
  category?: string
  generateThumbnail?: boolean
  thumbnailWidth?: number
  thumbnailHeight?: number
}

export type UploadImageResponse = ImageUploadResponse
export type GetImageMetadataResponse = ImageMetadata
export type ListImagesResponse = ImageMetadata[]
