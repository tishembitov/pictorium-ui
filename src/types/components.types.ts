/**
 * Типы для компонентов (Props/Emits)
 */

import type { Pin, User, Board, Comment } from './models.types'

// ============================================================================
// PIN COMPONENTS
// ============================================================================

export interface PinCardProps {
  pin: Pin
  loading?: boolean
}

export interface PinCardEmits {
  (e: 'like', pinId: string): void
  (e: 'save', pinId: string): void
  (e: 'click', pin: Pin): void
}

export interface PinGridProps {
  pins: Pin[]
  loading?: boolean
  columns?: number
}

export interface PinMediaProps {
  imageUrl: string
  videoPreviewUrl?: string | null
  alt?: string
  aspectRatio?: string
}

// ============================================================================
// BOARD COMPONENTS
// ============================================================================

export interface BoardCardProps {
  board: Board
}

export interface BoardCardEmits {
  (e: 'select', boardId: string): void
  (e: 'delete', boardId: string): void
}

export interface BoardSelectorProps {
  boards: Board[]
  selectedBoardId?: string | null
}

export interface BoardSelectorEmits {
  (e: 'select', boardId: string): void
  (e: 'create'): void
}

// ============================================================================
// COMMENT COMPONENTS
// ============================================================================

export interface CommentItemProps {
  comment: Comment
}

export interface CommentItemEmits {
  (e: 'reply', commentId: string): void
  (e: 'like', commentId: string): void
  (e: 'delete', commentId: string): void
}

export interface CommentInputProps {
  pinId: string
  parentCommentId?: string | null
  placeholder?: string
}

export type CommentInputEmits = (e: 'submit', content: string, imageUrl?: string) => void

// ============================================================================
// USER COMPONENTS
// ============================================================================

export interface UserAvatarProps {
  user: User | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  clickable?: boolean
}

export interface UserProfileProps {
  userId: string
}

export interface FollowButtonProps {
  userId: string
  isFollowing: boolean
}

export interface FollowButtonEmits {
  (e: 'follow'): void
  (e: 'unfollow'): void
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

export interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  icon?: string
}

export interface BaseInputProps {
  modelValue: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export type BaseInputEmits = (e: 'update:modelValue', value: string) => void
export interface BaseModalProps {
  modelValue: boolean
  title?: string
  maxWidth?: string
  closeOnClickOutside?: boolean
  showClose?: boolean
}

export interface BaseModalEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}
