// src/modules/chat/api/presenceApi.ts

import { get } from '@/shared/api/apiClient';
import { PRESENCE_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { UserPresenceResponse, UserPresence } from '../types/chat.types';

export const presenceApi = {
  /**
   * Get presence data for multiple users
   */
  getPresenceData: (userIds: string[]) => {
    return get<UserPresenceResponse>(PRESENCE_ENDPOINTS.batch(), {
      params: { userIds },
    });
  },

  /**
   * Get presence for a single user
   */
  getUserPresence: (userId: string) => {
    return get<UserPresence>(PRESENCE_ENDPOINTS.byUser(userId));
  },

  /**
   * Check if user is online (legacy)
   */
  isUserOnline: (userId: string) => {
    return get<boolean>(`${PRESENCE_ENDPOINTS.byUser(userId)}/online`);
  },
};

export default presenceApi;