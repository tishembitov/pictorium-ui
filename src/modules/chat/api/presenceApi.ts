// src/modules/chat/api/presenceApi.ts

import { get } from '@/shared/api/apiClient';
import { PRESENCE_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { UserPresenceResponse } from '../types/chat.types';

export const presenceApi = {
  /**
   * Get online status for multiple users
   */
  getOnlineStatus: (userIds: string[]) => {
    return get<UserPresenceResponse>(PRESENCE_ENDPOINTS.batch(), {
      params: { userIds },
    });
  },

  /**
   * Check if specific user is online
   */
  isUserOnline: (userId: string) => {
    return get<boolean>(PRESENCE_ENDPOINTS.byUser(userId));
  },
};

export default presenceApi;