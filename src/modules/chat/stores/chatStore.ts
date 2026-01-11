// src/modules/chat/stores/chatStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatState, ChatActions } from '../types/chat.types';

type ChatStore = ChatState & ChatActions;

const initialState: ChatState = {
  selectedChatId: null,
  isConnected: false,
  isConnecting: false,
  typingUsers: {},
  totalUnread: 0,
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setSelectedChat: (chatId) => 
        set({ selectedChatId: chatId }, false, 'setSelectedChat'),

      setConnected: (connected) => 
        set({ isConnected: connected, isConnecting: false }, false, 'setConnected'),

      setConnecting: (connecting) => 
        set({ isConnecting: connecting }, false, 'setConnecting'),

      setTypingUser: (chatId, userId, isTyping) =>
        set((state) => {
          const currentTyping = state.typingUsers[chatId] || [];
          
          let newTyping: string[];
          if (isTyping) {
            newTyping = currentTyping.includes(userId) 
              ? currentTyping 
              : [...currentTyping, userId];
          } else {
            newTyping = currentTyping.filter((id) => id !== userId);
          }

          return {
            typingUsers: {
              ...state.typingUsers,
              [chatId]: newTyping,
            },
          };
        }, false, 'setTypingUser'),

      setTotalUnread: (count) => 
        set({ totalUnread: count }, false, 'setTotalUnread'),

      incrementTotalUnread: () =>
        set((state) => ({ totalUnread: state.totalUnread + 1 }), false, 'incrementTotalUnread'),

      decrementTotalUnread: (by = 1) =>
        set((state) => ({ 
          totalUnread: Math.max(0, state.totalUnread - by) 
        }), false, 'decrementTotalUnread'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'ChatStore' }
  )
);

// Selectors
export const selectSelectedChatId = (state: ChatStore) => state.selectedChatId;
export const selectIsConnected = (state: ChatStore) => state.isConnected;
export const selectIsConnecting = (state: ChatStore) => state.isConnecting;
export const selectTotalUnread = (state: ChatStore) => state.totalUnread;
export const selectTypingUsers = (chatId: string) => (state: ChatStore) => 
  state.typingUsers[chatId] || [];

export default useChatStore;