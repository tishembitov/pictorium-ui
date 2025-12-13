// src/modules/user/types/subscription.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';
import type { UserResponse } from './user.types';

/**
 * Subscription response from API
 */
export interface SubscriptionResponse {
  status: string;
}

/**
 * Follow check response from API
 */
export interface FollowCheckResponse {
  isFollowing: boolean;
}

/**
 * Paginated users response
 */
export type PageUserResponse = PageResponse<UserResponse>;

/**
 * Follow/Unfollow action result
 */
export interface FollowActionResult {
  success: boolean;
  isFollowing: boolean;
  error?: string;
}