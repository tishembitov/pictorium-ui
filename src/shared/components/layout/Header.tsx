// src/shared/components/layout/Header.tsx

import React from 'react';
import { Box, Flex, FixedZIndex } from 'gestalt';
import { HeaderLogo } from './HeaderLogo';
import { HeaderSearch } from './HeaderSearch';
import { HeaderNav } from './HeaderNav';
import { HeaderUserMenu } from './HeaderUserMenu';
import { Z_INDEX, LAYOUT } from '../../utils/constants';

/**
 * Pinterest-style Header
 * - Fixed at top
 * - Logo, Nav, Search (main focus), User actions
 * - No sidebar toggle on desktop (Pinterest-style)
 */
export const Header: React.FC = () => {
  return (
    <Box
      as="header"
      position="fixed"
      top
      left
      right
      color="default"
      paddingX={4}
      paddingY={2}
      display="flex"
      alignItems="center"
      zIndex={new FixedZIndex(Z_INDEX.STICKY)}
      dangerouslySetInlineStyle={{
        __style: {
          height: `${LAYOUT.HEADER_HEIGHT}px`,
          borderBottom: '1px solid var(--border-light, #efefef)',
        },
      }}
    >
      <Flex alignItems="center" gap={2} flex="grow">
        {/* Logo */}
        <HeaderLogo />
        
        {/* Navigation - Home / Explore */}
        <HeaderNav />
        
        {/* Search - Main Focus */}
        <Box flex="grow" maxWidth={800} marginStart={2} marginEnd={2}>
          <HeaderSearch />
        </Box>
      </Flex>
      
      {/* User Actions */}
      <HeaderUserMenu />
    </Box>
  );
};

export default Header;