// src/shared/components/layout/MainLayout.tsx

import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from 'gestalt';
import { Header } from './Header';
import { MobileMenu } from './MobileMenu';
import { ToastContainer } from '../feedback/ToastContainer';
import { GlobalModals } from '../modals/GlobalModals';
import { FullPageLoader } from '../feedback/FullPageLoader';
import { useUIStore } from '../../stores/uiStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { LAYOUT } from '../../utils/constants';

/**
 * MainLayout - Pinterest-style minimal layout
 * - Fixed header
 * - No visible sidebar (Pinterest-style)
 * - Content with minimal padding
 * - Mobile menu for small screens
 */
export const MainLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const lastScrollY = useRef(0);
  
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);
  const globalLoadingMessage = useUIStore((state) => state.globalLoadingMessage);
  const setScrollPosition = useUIStore((state) => state.setScrollPosition);
  const setIsScrollingUp = useUIStore((state) => state.setIsScrollingUp);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      closeMobileMenu();
    }
  }, [isMobile, closeMobileMenu]);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollPosition(currentScrollY);
      setIsScrollingUp(currentScrollY < lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollPosition, setIsScrollingUp]);

  return (
    <Box minHeight="100vh" display="flex" direction="column" color="default">
      {/* Header */}
      <Header />
      
      {/* Mobile Menu */}
      {isMobile && <MobileMenu />}
      
      {/* Main Content - Minimal padding, Pinterest-style */}
      <Box 
        as="main" 
        flex="grow"
        dangerouslySetInlineStyle={{
          __style: { 
            paddingTop: `${LAYOUT.HEADER_HEIGHT}px`,
          },
        }}
      >
        {/* Content container with minimal padding */}
        <Box 
          maxWidth={LAYOUT.MAX_CONTENT_WIDTH}
          marginStart="auto" 
          marginEnd="auto" 
          width="100%"
          paddingX={2}
        >
          <Outlet />
        </Box>
      </Box>
      
      {/* Global Loading Overlay */}
      {isGlobalLoading && (
        <Box
          position="fixed"
          top
          left
          right
          bottom
          display="flex"
          alignItems="center"
          justifyContent="center"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 9999,
            },
          }}
        >
          <FullPageLoader accessibilityLabel={globalLoadingMessage || 'Loading...'} />
        </Box>
      )}
      
      {/* Global Modals */}
      <GlobalModals />
      
      {/* Toasts */}
      <ToastContainer />
    </Box>
  );
};

export default MainLayout;