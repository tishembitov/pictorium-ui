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
} as const;

// User Service Endpoints
export const USER_ENDPOINTS = {
  // Users - согласно OpenAPI
  me: () => `${API_PREFIXES.users}/me`,
  update: () => `${API_PREFIXES.users}/me`, // PATCH /api/v1/users/me
  byId: (userId: string) => `${API_PREFIXES.users}/user/id/${userId}`,
  byUsername: (username: string) => `${API_PREFIXES.users}/user/username/${username}`,
} as const;

// Subscription Endpoints - отдельно для ясности
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
  
  // Saved Pins
  save: (pinId: string) => `${API_PREFIXES.pins}/${pinId}/saves`,
  unsave: (pinId: string) => `${API_PREFIXES.pins}/${pinId}/saves`,
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
  
  // User Boards
  byUser: (userId: string) => `${API_PREFIXES.boards}/user/${userId}`,
  my: () => `${API_PREFIXES.boards}/me`,
  
  // Selected Board
  selected: () => `${API_PREFIXES.boards}/selected`,
  select: (boardId: string) => `${API_PREFIXES.boards}/${boardId}/select`,
  deselect: () => `${API_PREFIXES.boards}/selected`, // DELETE
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

// All endpoints combined
export const API_ENDPOINTS = {
  users: USER_ENDPOINTS,
  subscriptions: SUBSCRIPTION_ENDPOINTS,
  pins: PIN_ENDPOINTS,
  boards: BOARD_ENDPOINTS,
  comments: COMMENT_ENDPOINTS,
  tags: TAG_ENDPOINTS,
  images: IMAGE_ENDPOINTS,
} as const;

export default API_ENDPOINTS;