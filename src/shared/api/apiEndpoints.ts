// src/shared/api/apiEndpoints.ts

import { env } from '@/app/config/env';

// Base API URL (through gateway)
export const API_BASE_URL = env.apiGatewayUrl;

// Service prefixes
export const API_PREFIXES = {
  users: '/api/v1/users',
  subscriptions: '/api/v1/subscriptions',
  pins: '/api/v1/pins',
  boards: '/api/v1/boards',
  comments: '/api/v1/comments',
  tags: '/api/v1/tags',
  images: '/api/v1/images',
  chats: '/api/v1/chats',
  notifications: '/api/v1/notifications', // ✅ Добавлено
  sse: '/api/v1/sse', // ✅ Добавлено
} as const;

// User Service Endpoints
export const USER_ENDPOINTS = {
  me: () => `${API_PREFIXES.users}/me`,
  update: () => `${API_PREFIXES.users}/me`,
  byId: (userId: string) => `${API_PREFIXES.users}/user/id/${userId}`,
  byUsername: (username: string) => `${API_PREFIXES.users}/user/username/${username}`,
} as const;

// Subscription Endpoints
export const SUBSCRIPTION_ENDPOINTS = {
  follow: (userId: string) => `${API_PREFIXES.subscriptions}/users/${userId}`,
  unfollow: (userId: string) => `${API_PREFIXES.subscriptions}/users/${userId}`,
  followers: (userId: string) => `${API_PREFIXES.subscriptions}/followers/${userId}`,
  following: (userId: string) => `${API_PREFIXES.subscriptions}/following/${userId}`,
  checkFollow: (userId: string) => `${API_PREFIXES.subscriptions}/check/${userId}`,
} as const;

// Content Service - Pin Endpoints
export const PIN_ENDPOINTS = {
  // Pins CRUD
  list: () => API_PREFIXES.pins,
  create: () => API_PREFIXES.pins,
  byId: (pinId: string) => `${API_PREFIXES.pins}/${pinId}`,
  update: (pinId: string) => `${API_PREFIXES.pins}/${pinId}`,
  delete: (pinId: string) => `${API_PREFIXES.pins}/${pinId}`,
  
  // Pin Likes
  likes: (pinId: string) => `${API_PREFIXES.pins}/${pinId}/likes`,
  like: (pinId: string) => `${API_PREFIXES.pins}/${pinId}/likes`,
  unlike: (pinId: string) => `${API_PREFIXES.pins}/${pinId}/likes`,
  
  // Pin Comments
  comments: (pinId: string) => `${API_PREFIXES.pins}/${pinId}/comments`,
  createComment: (pinId: string) => `${API_PREFIXES.pins}/${pinId}/comments`,
  
  // ❌ УДАЛЕНО: save/unsave - таких эндпоинтов нет в API
  // Сохранение происходит через Board API
} as const;

// Board Endpoints
export const BOARD_ENDPOINTS = {
  // Boards CRUD
  create: () => API_PREFIXES.boards,
  byId: (boardId: string) => `${API_PREFIXES.boards}/${boardId}`,
  delete: (boardId: string) => `${API_PREFIXES.boards}/${boardId}`,
  
  // Board Pins
  pins: (boardId: string) => `${API_PREFIXES.boards}/${boardId}/pins`,
  addPin: (boardId: string, pinId: string) => `${API_PREFIXES.boards}/${boardId}/pins/${pinId}`,
  removePin: (boardId: string, pinId: string) => `${API_PREFIXES.boards}/${boardId}/pins/${pinId}`,
  
  // ✅ Batch Pin Operations
  savePinToBoards: (pinId: string) => `${API_PREFIXES.boards}/pins/${pinId}`,
  
  // ✅ NEW: Create board and save pin in one request
  createWithPin: (pinId: string) => `${API_PREFIXES.boards}/with-pin/${pinId}`,
  
  // User Boards
  byUser: (userId: string) => `${API_PREFIXES.boards}/user/${userId}`,
  my: () => `${API_PREFIXES.boards}/me`,
  myForPin: (pinId: string) => `${API_PREFIXES.boards}/me/for-pin/${pinId}`,
  
  // Selected Board
  selected: () => `${API_PREFIXES.boards}/selected`,
  select: (boardId: string) => `${API_PREFIXES.boards}/${boardId}/select`,
  deselect: () => `${API_PREFIXES.boards}/selected`,
} as const;

// Comment Endpoints
export const COMMENT_ENDPOINTS = {
  byId: (commentId: string) => `${API_PREFIXES.comments}/${commentId}`,
  update: (commentId: string) => `${API_PREFIXES.comments}/${commentId}`,
  delete: (commentId: string) => `${API_PREFIXES.comments}/${commentId}`,
  
  // Replies
  replies: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/replies`,
  createReply: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/replies`,
  
  // Comment Likes
  likes: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/likes`,
  like: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/likes`,
  unlike: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/likes`,
} as const;

// Tag Endpoints
export const TAG_ENDPOINTS = {
  list: () => API_PREFIXES.tags,
  byId: (tagId: string) => `${API_PREFIXES.tags}/${tagId}`,
  search: () => `${API_PREFIXES.tags}/search`,
  byPin: (pinId: string) => `${API_PREFIXES.tags}/pins/${pinId}`,
  categories: () => `${API_PREFIXES.tags}/categories`,
} as const;

// Storage Service - Image Endpoints
export const IMAGE_ENDPOINTS = {
  presignedUpload: () => `${API_PREFIXES.images}/presigned-upload`,
  confirm: () => `${API_PREFIXES.images}/confirm`,
  byId: (imageId: string) => `${API_PREFIXES.images}/${imageId}`,
  url: (imageId: string) => `${API_PREFIXES.images}/${imageId}/url`,
  metadata: (imageId: string) => `${API_PREFIXES.images}/${imageId}/metadata`,
  delete: (imageId: string) => `${API_PREFIXES.images}/${imageId}`,
  list: () => `${API_PREFIXES.images}/list`,
} as const;

// Chat Service Endpoints
export const CHAT_ENDPOINTS = {
  // Chats
  list: () => `${API_PREFIXES.chats}`,
  byId: (chatId: string) => `${API_PREFIXES.chats}/${chatId}`,
  withUser: (recipientId: string) => `${API_PREFIXES.chats}/with/${recipientId}`,
  delete: (chatId: string) => `${API_PREFIXES.chats}/${chatId}`,
  
  // Messages
  messages: (chatId: string) => `${API_PREFIXES.chats}/${chatId}/messages`,
  allMessages: (chatId: string) => `${API_PREFIXES.chats}/${chatId}/messages/all`,
  markRead: (chatId: string) => `${API_PREFIXES.chats}/${chatId}/messages/read`,
  unreadCount: (chatId: string) => `${API_PREFIXES.chats}/${chatId}/messages/unread/count`,
} as const;

export const PRESENCE_ENDPOINTS = {
  batch: () => '/api/v1/presence',
  byUser: (userId: string) => `/api/v1/presence/${userId}`,
} as const;


// ✅ Notification Service Endpoints
export const NOTIFICATION_ENDPOINTS = {
  list: () => `${API_PREFIXES.notifications}`,
  unread: () => `${API_PREFIXES.notifications}/unread`,
  unreadCount: () => `${API_PREFIXES.notifications}/unread/count`,
  markAsRead: () => `${API_PREFIXES.notifications}/read`,
  markAllAsRead: () => `${API_PREFIXES.notifications}/read-all`,
  delete: (id: string) => `${API_PREFIXES.notifications}/${id}`,
} as const;

// ✅ SSE Endpoints
export const SSE_ENDPOINTS = {
  connect: () => `${API_PREFIXES.sse}/connect`,
} as const;

// All endpoints combined
export const API_ENDPOINTS = {
  users: USER_ENDPOINTS,
  subscriptions: SUBSCRIPTION_ENDPOINTS,
  pins: PIN_ENDPOINTS,
  boards: BOARD_ENDPOINTS,
  comments: COMMENT_ENDPOINTS,
  tags: TAG_ENDPOINTS,
  images: IMAGE_ENDPOINTS,
  chats: CHAT_ENDPOINTS,
  notifications: NOTIFICATION_ENDPOINTS, // ✅ Добавлено
  sse: SSE_ENDPOINTS, // ✅ Добавлено
} as const;
