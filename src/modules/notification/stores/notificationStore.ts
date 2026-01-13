// src/modules/notification/stores/notificationStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NotificationState, NotificationActions } from '../types/notification.types';

type NotificationStore = NotificationState & NotificationActions;

const initialState: NotificationState = {
  unreadCount: 0,
  isConnected: false,
  isConnecting: false,
  lastEventTime: null,
};

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setUnreadCount: (count) => 
        set({ unreadCount: count }, false, 'setUnreadCount'),

      incrementUnread: () =>
        set((state) => ({ unreadCount: state.unreadCount + 1 }), false, 'incrementUnread'),

      decrementUnread: (by = 1) =>
        set((state) => ({ 
          unreadCount: Math.max(0, state.unreadCount - by) 
        }), false, 'decrementUnread'),

      setConnected: (connected) => 
        set({ isConnected: connected, isConnecting: false }, false, 'setConnected'),

      setConnecting: (connecting) => 
        set({ isConnecting: connecting }, false, 'setConnecting'),

      setLastEventTime: (time) => 
        set({ lastEventTime: time }, false, 'setLastEventTime'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'NotificationStore' }
  )
);

// Selectors
export const selectUnreadCount = (state: NotificationStore) => state.unreadCount;
export const selectIsConnected = (state: NotificationStore) => state.isConnected;
export const selectIsConnecting = (state: NotificationStore) => state.isConnecting;

export default useNotificationStore;