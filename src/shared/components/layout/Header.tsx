// src/shared/components/layout/Header.tsx
import React from 'react';
import { Box, Flex, FixedZIndex } from 'gestalt';
import { HeaderLogo } from './HeaderLogo';
import { HeaderSearch } from './HeaderSearch';
import { HeaderNav } from './HeaderNav';
import { HeaderUserMenu } from './HeaderUserMenu';
import { Z_INDEX } from '../../utils/constants';

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
        {/* Logo */}
        <HeaderLogo />
        
        {/* Navigation */}
        <HeaderNav />
        
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