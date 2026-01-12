// src/app/providers/index.tsx

import React, { type ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { GestaltProvider } from './GestaltProvider';
import { RouterProvider } from './RouterProvider';
import { ChatProvider } from './ChatProvider';
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <GestaltProvider>
        <AuthProvider fallback={<FullPageLoader />}>
          <QueryProvider>
            <RouterProvider>
              <ChatProvider>
                {children}
              </ChatProvider>
            </RouterProvider>
          </QueryProvider>
        </AuthProvider>
      </GestaltProvider>
    </ErrorBoundary>
  );
};

// Экспорты провайдеров
export { AuthProvider } from './AuthProvider';
export { QueryProvider } from './QueryProvider';
export { GestaltProvider } from './GestaltProvider';
export { RouterProvider } from './RouterProvider';
export { ChatProvider } from './ChatProvider';

// eslint-disable-next-line react-refresh/only-export-components
export { useChatContext } from './chatContext';

export default AppProviders;