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
  // Users
  me: () => `${API_PREFIXES.users}/me`,
  byId: (userId: string) => `${API_PREFIXES.users}/user/id/${userId}`,
  byUsername: (username: string) => `${API_PREFIXES.users}/user/username/${username}`,
  
  // Subscriptions
  follow: (userId: string) => `${API_PREFIXES.subscriptions}/users/${userId}`,
  unfollow: (userId: string) => `${API_PREFIXES.subscriptions}/users/${userId}`,
  followers: (userId: string) => `${API_PREFIXES.subscriptions}/followers/${userId}`,
  following: (userId: string) => `${API_PREFIXES.subscriptions}/following/${userId}`,
  checkFollow: (userId: string) => `${API_PREFIXES.subscriptions}/check/${userId}`,
} as const;

// Content Service Endpoints
export const PIN_ENDPOINTS = {
  // Pins
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

export const BOARD_ENDPOINTS = {
  // Boards
  create: () => API_PREFIXES.boards,
  byId: (boardId: string) => `${API_PREFIXES.boards}/${boardId}`,
  delete: (boardId: string) => `${API_PREFIXES.boards}/${boardId}`,
  pins: (boardId: string) => `${API_PREFIXES.boards}/${boardId}/pins`,
  addPin: (boardId: string, pinId: string) => `${API_PREFIXES.boards}/${boardId}/pins/${pinId}`,
  removePin: (boardId: string, pinId: string) => `${API_PREFIXES.boards}/${boardId}/pins/${pinId}`,
  byUser: (userId: string) => `${API_PREFIXES.boards}/user/${userId}`,
  my: () => `${API_PREFIXES.boards}/me`,
  selected: () => `${API_PREFIXES.boards}/selected`,
  select: (boardId: string) => `${API_PREFIXES.boards}/${boardId}/select`,
} as const;

export const COMMENT_ENDPOINTS = {
  byId: (commentId: string) => `${API_PREFIXES.comments}/${commentId}`,
  update: (commentId: string) => `${API_PREFIXES.comments}/${commentId}`,
  delete: (commentId: string) => `${API_PREFIXES.comments}/${commentId}`,
  replies: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/replies`,
  createReply: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/replies`,
  likes: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/likes`,
  like: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/likes`,
  unlike: (commentId: string) => `${API_PREFIXES.comments}/${commentId}/likes`,
} as const;

export const TAG_ENDPOINTS = {
  list: () => API_PREFIXES.tags,
  byId: (tagId: string) => `${API_PREFIXES.tags}/${tagId}`,
  search: () => `${API_PREFIXES.tags}/search`,
  byPin: (pinId: string) => `${API_PREFIXES.tags}/pins/${pinId}`,
  categories: () => `${API_PREFIXES.tags}/categories`,
} as const;

// Storage Service Endpoints
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
  pins: PIN_ENDPOINTS,
  boards: BOARD_ENDPOINTS,
  comments: COMMENT_ENDPOINTS,
  tags: TAG_ENDPOINTS,
  images: IMAGE_ENDPOINTS,
} as const;

export default API_ENDPOINTS;