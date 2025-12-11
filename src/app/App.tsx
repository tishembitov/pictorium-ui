import React from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './router';

// Import global styles
import '@/app/styles/index.css';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

export default App;