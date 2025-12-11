import React, { ReactNode } from 'react';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { GestaltProvider } from '@/app/providers/GestaltProvider';
import { RouterProvider } from '@/app/providers/RouterProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <GestaltProvider>
      <AuthProvider fallback={<div>Loading...</div>}>
        <QueryProvider>
          <RouterProvider>
            {children}
          </RouterProvider>
        </QueryProvider>
      </AuthProvider>
    </GestaltProvider>
  );
};

// Re-export components
export { AuthProvider } from '@/app/providers/AuthProvider';
export { QueryProvider } from '@/app/providers/QueryProvider';
export { GestaltProvider } from '@/app/providers/GestaltProvider';
export { RouterProvider } from '@/app/providers/RouterProvider';

export default AppProviders;