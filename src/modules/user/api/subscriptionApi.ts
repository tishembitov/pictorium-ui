// src/modules/user/api/subscriptionApi.ts

import { get, post, del } from '@/shared/api/apiClient';
import { SUBSCRIPTION_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type { 
  SubscriptionResponse, 
  FollowCheckResponse, 
  PageUserResponse 
} from '../types/subscription.types';

/**
 * Subscription API client
 */
export const subscriptionApi = {
  /**
   * Follow a user
   */
  follow: (userId: string) => {
    return post<SubscriptionResponse>(SUBSCRIPTION_ENDPOINTS.follow(userId));
  },

  /**
   * Unfollow a user
   */
  unfollow: (userId: string) => {
    return del<void>(SUBSCRIPTION_ENDPOINTS.unfollow(userId));
  },

  /**
   * Get user's followers
   */
  getFollowers: (userId: string, pageable: Pageable = {}) => {
    return get<PageUserResponse>(SUBSCRIPTION_ENDPOINTS.followers(userId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Get users that a user is following
   */
  getFollowing: (userId: string, pageable: Pageable = {}) => {
    return get<PageUserResponse>(SUBSCRIPTION_ENDPOINTS.following(userId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Check if current user follows a specific user
   */
  checkFollow: (userId: string) => {
    return get<FollowCheckResponse>(SUBSCRIPTION_ENDPOINTS.checkFollow(userId));
  },
};

export default subscriptionApi;