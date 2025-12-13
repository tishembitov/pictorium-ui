// src/modules/user/api/userApi.ts

import { get, patch } from '@/shared/api/apiClient';
import { USER_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { UserResponse, UserUpdateRequest } from '../types/user.types';

/**
 * User API client
 */
export const userApi = {
  /**
   * Get current authenticated user
   */
  getMe: () => {
    return get<UserResponse>(USER_ENDPOINTS.me());
  },

  /**
   * Update current user profile
   */
  updateMe: (data: UserUpdateRequest) => {
    return patch<UserResponse, UserUpdateRequest>(USER_ENDPOINTS.update(), data);
  },

  /**
   * Get user by ID
   */
  getById: (userId: string) => {
    return get<UserResponse>(USER_ENDPOINTS.byId(userId));
  },

  /**
   * Get user by username
   */
  getByUsername: (username: string) => {
    return get<UserResponse>(USER_ENDPOINTS.byUsername(username));
  },
};

export default userApi;