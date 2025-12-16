// src/shared/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Text, Icon, Flex, Divider } from 'gestalt';
import { useUIStore } from '../../stores/uiStore';
import { useAuth } from '@/modules/auth';
import { ROUTES } from '@/app/router/routeConfig';
import { Z_INDEX } from '../../utils/constants';

type SidebarIconName = 'home' | 'compass' | 'add' | 'person' | 'cog';

interface SidebarItem {
  path: string;
  label: string;
  icon: SidebarIconName;
  requiresAuth?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { path: ROUTES.HOME, label: 'Home', icon: 'home' },
  { path: ROUTES.EXPLORE, label: 'Explore', icon: 'compass' },
  { path: ROUTES.PIN_CREATE, label: 'Create', icon: 'add', requiresAuth: true },
];

const bottomItems: SidebarItem[] = [
  { path: ROUTES.SETTINGS, label: 'Settings', icon: 'cog', requiresAuth: true },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // UI Store
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const closeSidebar = useUIStore((state) => state.closeSidebar);

  if (!isSidebarOpen) {
    return null;
  }

  const filterItems = (items: SidebarItem[]) => 
    items.filter(item => !item.requiresAuth || isAuthenticated);

  const renderItem = (item: SidebarItem) => {
    const isActive = location.pathname === item.path;
    
    return (
      <Link 
        key={item.path} 
        to={item.path} 
        style={{ textDecoration: 'none' }}
        onClick={() => {
          // Close sidebar on mobile after navigation
          if (window.innerWidth < 768) {
            closeSidebar();
          }
        }}
      >
        <Box
          padding={3}
          rounding={3}
          color={isActive ? 'secondary' : 'transparent'}
          display="flex"
          alignItems="center"
          width="100%"
        >
          <Flex alignItems="center" gap={3}>
            <Icon
              accessibilityLabel=""
              icon={item.icon}
              size={20}
              color={isActive ? 'default' : 'subtle'}
            />
            {!isSidebarCollapsed && (
              <Text
                weight={isActive ? 'bold' : 'normal'}
                color={isActive ? 'default' : 'subtle'}
              >
                {item.label}
              </Text>
            )}
          </Flex>
        </Box>
      </Link>
    );
  };

  const sidebarWidth = isSidebarCollapsed ? 72 : 240;

  return (
    <Box
      as="aside"
      color="default"
      padding={2}
      height="100%"
      position="fixed"
      top
      left
      display="flex"
      direction="column"
      dangerouslySetInlineStyle={{
        __style: {
          width: sidebarWidth,
          paddingTop: 'var(--header-height)',
          borderRight: '1px solid var(--border-light)',
          transition: 'width 0.2s ease',
          zIndex: Z_INDEX.STICKY - 1,
        },
      }}
    >
      {/* Main navigation */}
      <Box flex="grow">
        <Flex direction="column" gap={1}>
          {filterItems(sidebarItems).map(renderItem)}
        </Flex>
      </Box>
      
      {/* Bottom items */}
      {filterItems(bottomItems).length > 0 && (
        <Box>
          <Divider />
          <Box paddingY={2}>
            <Flex direction="column" gap={1}>
              {filterItems(bottomItems).map(renderItem)}
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};


export default Sidebar;