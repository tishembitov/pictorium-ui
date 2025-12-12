// src/shared/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Text, Icon, Flex } from 'gestalt';
import { ROUTES } from '../../utils/constants';

type SidebarIconName = 'home' | 'compass' | 'add';

interface SidebarItem {
  path: string;
  label: string;
  icon: SidebarIconName;
}

const sidebarItems: SidebarItem[] = [
  { path: ROUTES.HOME, label: 'Home', icon: 'home' },
  { path: ROUTES.EXPLORE, label: 'Explore', icon: 'compass' },
  { path: ROUTES.PIN_CREATE, label: 'Create', icon: 'add' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation();

  if (!isOpen) {
    return null;
  }

  return (
    <Box
      as="aside"
      color="default"
      padding={4}
      height="100%"
      width={240}
      dangerouslySetInlineStyle={{
        __style: {
          borderRight: '1px solid var(--border-light)',
        },
      }}
    >
      <Flex direction="column" gap={2}>
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ textDecoration: 'none' }}
              onClick={onClose}
            >
              <Flex
                alignItems="center"
                gap={3}
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
                    <Text
                      weight={isActive ? 'bold' : 'normal'}
                      color={isActive ? 'default' : 'subtle'}
                    >
                      {item.label}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </Link>
          );
        })}
      </Flex>
    </Box>
  );
};

export default Sidebar;