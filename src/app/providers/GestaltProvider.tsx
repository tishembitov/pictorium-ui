// src/app/providers/GestaltProvider.tsx

import React, { type ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';

interface GestaltProviderProps {
  children: ReactNode;
}

export const GestaltProvider: React.FC<GestaltProviderProps> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

export default GestaltProvider;