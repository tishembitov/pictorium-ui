// src/modules/chat/api/chatApi.ts

import { get, post, del } from '@/shared/api/apiClient';
import { CHAT_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { ChatResponse } from '../types/chat.types';

export const chatApi = {
  /**
   * Get all chats for current user
   */
  getMyChats: () => {
    return get<ChatResponse[]>(CHAT_ENDPOINTS.list());
  },

  /**
   * Get chat by ID
   */
  getById: (chatId: string) => {
    return get<ChatResponse>(CHAT_ENDPOINTS.byId(chatId));
  },

  /**
   * Get or create chat with user
   */
  getOrCreateChat: (recipientId: string) => {
    return post<ChatResponse>(CHAT_ENDPOINTS.withUser(recipientId));
  },

  /**
   * Delete chat
   */
  deleteChat: (chatId: string) => {
    return del<void>(CHAT_ENDPOINTS.delete(chatId));
  },
};

export default chatApi;