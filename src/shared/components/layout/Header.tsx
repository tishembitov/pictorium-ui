// src/shared/components/layout/Header.tsx
import React from 'react';
import { Box, Flex, FixedZIndex, IconButton } from 'gestalt';
import { HeaderLogo } from './HeaderLogo';
import { HeaderSearch } from './HeaderSearch';
import { HeaderNav } from './HeaderNav';
import { HeaderUserMenu } from './HeaderUserMenu';
import { useUIStore } from '../../stores/uiStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Z_INDEX } from '../../utils/constants';

export const Header: React.FC = () => {
  const isMobile = useIsMobile();
  
  // UI Store
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);

  return (
    <Box
      as="header"
      position="fixed"
      top
      left
      right
      color="default"
      paddingX={4}
      paddingY={3}
      display="flex"
      alignItems="center"
      zIndex={new FixedZIndex(Z_INDEX.STICKY)}
      dangerouslySetInlineStyle={{
        __style: {
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-light)',
        },
      }}
    >
      <Flex alignItems="center" gap={4} flex="grow">
        {/* Sidebar Toggle - Desktop */}
        {!isMobile && (
          <IconButton
            accessibilityLabel={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            icon="menu"
            onClick={toggleSidebar}
            size="md"
            bgColor="transparent"
          />
        )}
        
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <IconButton
            accessibilityLabel={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            icon="menu"
            onClick={toggleMobileMenu}
            size="md"
            bgColor="transparent"
          />
        )}
        
        {/* Logo */}
        <HeaderLogo />
        
        {/* Navigation - hidden on mobile */}
        {!isMobile && <HeaderNav />}
        
        {/* Search */}
        <Box flex="grow" maxWidth={800}>
          <HeaderSearch />
        </Box>
      </Flex>
      
      {/* User Menu */}
      <Box marginStart={4}>
        <HeaderUserMenu />
      </Box>
    </Box>
  );
};

export default Header;