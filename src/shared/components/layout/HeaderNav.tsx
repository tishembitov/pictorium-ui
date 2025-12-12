// src/shared/components/layout/HeaderNav.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Flex, Text } from 'gestalt';
import { ROUTES } from '../../utils/constants';

interface NavItem {
  path: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: ROUTES.HOME, label: 'Home' },
  { path: ROUTES.EXPLORE, label: 'Explore' },
];

export const HeaderNav: React.FC = () => {
  const location = useLocation();

  return (
    <Box display="none" mdDisplay="flex">
      <Flex alignItems="center" gap={2}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <Box
                padding={3}
                rounding="pill"
                color={isActive ? 'dark' : 'transparent'}
              >
                <Text 
                  weight="bold" 
                  color={isActive ? 'inverse' : 'default'}
                  size="200"
                >
                  {item.label}
                </Text>
              </Box>
            </Link>
          );
        })}
      </Flex>
    </Box>
  );
};

export default HeaderNav;