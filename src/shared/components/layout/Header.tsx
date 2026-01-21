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
 * Search takes maximum width
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
      paddingX={3}
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
      {/* Left side: Logo + Nav - minimal width */}
      <Flex alignItems="center" gap={1}>
        <HeaderLogo />
        <HeaderNav />
      </Flex>

      {/* Center: Search - Maximum width */}
      <Box flex="grow" paddingX={3}>
        <HeaderSearch />
      </Box>

      {/* Right side: User Actions - minimal width */}
      <HeaderUserMenu />
    </Box>
  );
};

export default Header;