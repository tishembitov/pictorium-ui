// src/shared/components/layout/MainLayout.tsx

import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from 'gestalt';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { ToastContainer } from '../feedback/ToastContainer';
import { GlobalModals } from '../modals/GlobalModals';
import { FullPageLoader } from '../feedback/FullPageLoader';
import { useUIStore } from '../../stores/uiStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { LAYOUT } from '../../utils/constants';

export const MainLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const lastScrollY = useRef(0);
  
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);
  const globalLoadingMessage = useUIStore((state) => state.globalLoadingMessage);
  const setScrollPosition = useUIStore((state) => state.setScrollPosition);
  const setIsScrollingUp = useUIStore((state) => state.setIsScrollingUp);
  const closeSidebar = useUIStore((state) => state.closeSidebar);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [isMobile, closeSidebar]);

  useEffect(() => {
    if (!isMobile) {
      closeMobileMenu();
    }
  }, [isMobile, closeMobileMenu]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = globalThis.scrollY;
      setScrollPosition(currentScrollY);
      setIsScrollingUp(currentScrollY < lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };

    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    return () => globalThis.removeEventListener('scroll', handleScroll);
  }, [setScrollPosition, setIsScrollingUp]);

  const getContentMarginLeft = (): number => {
    if (isMobile || !isSidebarOpen) return 0;
    return isSidebarCollapsed 
      ? LAYOUT.SIDEBAR_COLLAPSED_WIDTH 
      : LAYOUT.SIDEBAR_WIDTH;
  };

  return (
    <>
      <Header />
      
      {!isMobile && <Sidebar />}
      {isMobile && <MobileMenu />}
      
      <Box 
        as="main" 
        flex="grow"
        paddingX={1}
        dangerouslySetInlineStyle={{
          __style: { 
            paddingTop: `${LAYOUT.HEADER_HEIGHT}px`,
            marginLeft: getContentMarginLeft(),
            transition: 'margin-left 0.2s ease',
          },
        }}
      >
        <Box 
          maxWidth={LAYOUT.MAX_CONTENT_WIDTH}
          marginStart="auto" 
          marginEnd="auto" 
          width="100%"
          padding={1}
        >
          <Outlet />
        </Box>
      </Box>
      
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
          <FullPageLoader accessibilityLabel={globalLoadingMessage ?? 'Loading...'} />
        </Box>
      )}
      
      <GlobalModals />
      <ToastContainer />
    </>
  );
};

export default MainLayout;