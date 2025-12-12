// src/shared/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from 'gestalt';
import { Header } from './Header'
import { ToastContainer } from '../feedback/ToastContainer';

export const MainLayout: React.FC = () => {
  return (
    <Box minHeight="100vh" display="flex" direction="column" color="default">
      <Header />
      
      <Box 
        as="main" 
        flex="grow"
        paddingX={4}
        dangerouslySetInlineStyle={{
          __style: { paddingTop: 'var(--header-height)' },
        }}
      >
        <Box maxWidth={1440} marginStart="auto" marginEnd="auto" width="100%">
          <Outlet />
        </Box>
      </Box>
      
      <ToastContainer />
    </Box>
  );
};

export default MainLayout;