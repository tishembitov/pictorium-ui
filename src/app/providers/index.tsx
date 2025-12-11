// src/app/providers/index.tsx
import React, { type ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { GestaltProvider } from './GestaltProvider';
import { RouterProvider } from './RouterProvider';
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
              {children}
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
export { GestaltProvider, useTheme } from './GestaltProvider';
export { RouterProvider } from './RouterProvider';


export default AppProviders;