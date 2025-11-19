/**
 * Типы для Pinia stores
 */

import type { Pin, Board } from './models.types'

// ============================================================================
// PINS STORE
// ============================================================================

export interface PinsState {
  pins: Pin[]
  currentPin: Pin | null
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  page: number
  totalPages: number
}

// ============================================================================
// BOARDS STORE
// ============================================================================

export interface BoardsState {
  boards: Board[]
  selectedBoard: Board | null
  isLoading: boolean
  error: string | null
}

// ============================================================================
// UI STORE
// ============================================================================

export interface UIState {
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  activeModal: string | null
  theme: 'light' | 'dark'
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// ============================================================================
// SEARCH STORE
// ============================================================================

export interface SearchState {
  query: string
  results: Pin[]
  recentSearches: string[]
  isSearching: boolean
  error: string | null
}

// ============================================================================
// NOTIFICATIONS STORE
// ============================================================================

export interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
}

export interface AppNotification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  userId: string
  content: string
  isRead: boolean
  createdAt: string
  pinId?: string
  commentId?: string
}

// ============================================================================
// CHATS STORE
// ============================================================================

export interface ChatsState {
  chats: Chat[]
  currentChat: Chat | null
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export interface Chat {
  id: string
  participants: string[]
  lastMessage: Message | null
  unreadCount: number
  updatedAt: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  imageUrl?: string
  status: MessageStatus
  createdAt: string
  updatedAt: string
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}
