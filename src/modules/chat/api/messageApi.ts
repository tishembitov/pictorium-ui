// src/modules/chat/api/messageApi.ts

import { get, patch } from '@/shared/api/apiClient';
import { CHAT_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams, type Pageable } from '@/shared/api/apiTypes';
import type { MessageResponse, PageMessageResponse } from '../types/chat.types';

export const messageApi = {
  /**
   * Get messages with pagination (for infinite scroll)
   */
  getMessages: (chatId: string, pageable: Pageable = {}) => {
    return get<PageMessageResponse>(CHAT_ENDPOINTS.messages(chatId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Get all messages (without pagination)
   */
  getAllMessages: (chatId: string) => {
    return get<MessageResponse[]>(CHAT_ENDPOINTS.allMessages(chatId));
  },

  /**
   * Mark messages as read
   */
  markAsRead: (chatId: string) => {
    return patch<number>(CHAT_ENDPOINTS.markRead(chatId));
  },

  /**
   * Get unread count for chat
   */
  getUnreadCount: (chatId: string) => {
    return get<number>(CHAT_ENDPOINTS.unreadCount(chatId));
  },
};

export default messageApi;