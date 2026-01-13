// src/app/providers/NotificationProvider.tsx

import React, { type ReactNode } from 'react';
import { useAuthStore } from '@/modules/auth';
import { useNotificationSSE, useUnreadCount } from '@/modules/notification';

const NotificationProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  useNotificationSSE();
  useUnreadCount();

  return <>{children}</>;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <NotificationProviderInner>
        {children}
      </NotificationProviderInner>
    );
  }

  return <>{children}</>;
};

export default NotificationProvider;