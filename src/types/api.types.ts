/**
 * API Request/Response типы
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
} from './models.types'

// ============================================================================
// USER API
// ============================================================================

export interface UserUpdateRequest {
  username?: string
  description?: string
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

export interface FollowUserParams {
  userIdToFollow: string
}

export interface UnfollowUserParams {
  userIdToUnfollow: string
}

export interface GetFollowersParams {
  userId: string
  pageable: Pageable
}

export interface GetFollowingParams {
  userId: string
  pageable: Pageable
}

export interface CheckFollowParams {
  userIdToCheck: string
}

export type FollowUserResponse = Subscription
export type GetFollowersResponse = PageUser
export type GetFollowingResponse = PageUser
export type CheckFollowResponse = FollowCheckResponse

// ============================================================================
// PIN API
// ============================================================================

export interface PinCreateRequest {
  title?: string
  description?: string
  href?: string
  imageUrl?: string // Сделаем optional
  videoPreviewUrl?: string
  rgb?: string
  height?: string
  tags?: Set<string> // Исправим на Set
}

export interface PinUpdateRequest {
  title?: string
  description?: string
  href?: string
  tags?: Set<string> // Исправим на Set
}

export interface GetPinsParams {
  filter: PinFilter
  pageable: Pageable
}

export interface GetPinByIdParams {
  pinId: string
}

export interface UpdatePinParams {
  pinId: string
  data: PinUpdateRequest
}

export interface DeletePinParams {
  pinId: string
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

export interface GetBoardParams {
  boardId: string
}

export interface GetBoardPinsParams {
  boardId: string
  pageable: Pageable
}

export interface GetUserBoardsParams {
  userId: string
}

export interface AddPinToBoardParams {
  boardId: string
  pinId: string
}

export interface RemovePinFromBoardParams {
  boardId: string
  pinId: string
}

export interface DeleteBoardParams {
  boardId: string
}

export interface SelectBoardParams {
  boardId: string
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
  content: string
  imageUrl?: string
}

export interface CommentUpdateRequest {
  content?: string
  imageUrl?: string
}

export interface GetCommentsParams {
  pinId: string
  pageable: Pageable
}

export interface CreateCommentParams {
  pinId: string
  data: CommentCreateRequest
}

export interface GetCommentParams {
  commentId: string
}

export interface UpdateCommentParams {
  commentId: string
  data: CommentUpdateRequest
}

export interface DeleteCommentParams {
  commentId: string
}

export interface GetRepliesParams {
  commentId: string
  pageable: Pageable
}

export interface CreateReplyParams {
  commentId: string
  data: CommentCreateRequest
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

export interface LikePinParams {
  pinId: string
}

export interface UnlikePinParams {
  pinId: string
}

export interface GetPinLikesParams {
  pinId: string
  pageable: Pageable
}

export interface LikeCommentParams {
  commentId: string
}

export interface UnlikeCommentParams {
  commentId: string
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

export interface SavePinParams {
  pinId: string
}

export interface UnsavePinParams {
  pinId: string
}

export type SavePinResponse = Pin

// ============================================================================
// TAG API
// ============================================================================

export interface GetAllTagsParams {
  pageable: Pageable
}

export interface GetTagByIdParams {
  tagId: string
}

export interface SearchTagsParams {
  q: string
  limit?: number
}

export interface GetPinTagsParams {
  pinId: string
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

export interface UploadImageParams {
  formData: FormData
}

export interface GetImageParams {
  imageId: string
}

export interface DeleteImageParams {
  imageId: string
}

export interface GetImageUrlParams {
  imageId: string
  expiry?: number
}

export interface GetImageMetadataParams {
  imageId: string
}

export interface ListImagesParams {
  category?: string
}

export type UploadImageResponse = ImageUploadResponse
export type GetImageUrlResponse = string
export type GetImageMetadataResponse = ImageMetadata
export type ListImagesResponse = ImageMetadata[]
