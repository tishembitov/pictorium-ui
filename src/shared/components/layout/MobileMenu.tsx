// src/shared/components/layout/MobileMenu.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Layer, 
  FixedZIndex, 
  Flex, 
  Text, 
  Icon, 
  TapArea,
  Divider,
} from 'gestalt';
import { useUIStore } from '../../stores/uiStore';
import { useAuth } from '@/modules/auth';
import { ROUTES, buildPath } from '@/app/router/routeConfig';
import { Z_INDEX } from '../../utils/constants';

interface MenuItem {
  path: string;
  label: string;
  icon: 'home' | 'compass' | 'add' | 'person' | 'cog';
  requiresAuth?: boolean;
}

const menuItems: MenuItem[] = [
  { path: ROUTES.HOME, label: 'Home', icon: 'home' },
  { path: ROUTES.EXPLORE, label: 'Explore', icon: 'compass' },
  { path: ROUTES.PIN_CREATE, label: 'Create Pin', icon: 'add', requiresAuth: true },
];

export const MobileMenu: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user, login, logout } = useAuth();
  
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  if (!isMobileMenuOpen) {
    return null;
  }

  const handleNavigate = () => {
    closeMobileMenu();
  };

  const handleLogin = () => {
    closeMobileMenu();
    login();
  };

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
  };

  const filteredItems = menuItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  return (
    <Layer zIndex={new FixedZIndex(Z_INDEX.MODAL)}>
      {/* Backdrop */}
      <Box
        position="fixed"
        top
        left
        right
        bottom
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            paddingTop: 'var(--header-height)',
          },
        }}
      >
        <TapArea onTap={closeMobileMenu} fullWidth fullHeight>
          <Box width="100%" height="100%" />
        </TapArea>
      </Box>

      {/* Menu Panel */}
      <Box
        position="fixed"
        top
        left
        bottom
        color="default"
        width={280}
        dangerouslySetInlineStyle={{
          __style: {
            paddingTop: 'var(--header-height)',
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideInLeft 0.2s ease',
          },
        }}
      >
        <Box padding={4}>
          {/* User Section */}
          {isAuthenticated && user && (
            <>
              <Link 
                to={buildPath.profile(user.username || '')} 
                style={{ textDecoration: 'none' }}
                onClick={handleNavigate}
              >
                <Box marginBottom={4}>
                  <Flex alignItems="center" gap={3}>
                    <Box
                      color="secondary"
                      rounding="circle"
                      width={48}
                      height={48}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon accessibilityLabel="" icon="person" size={24} />
                    </Box>
                    <Flex direction="column">
                      <Text weight="bold">{user.username}</Text>
                      <Text size="100" color="subtle">{user.email}</Text>
                    </Flex>
                  </Flex>
                </Box>
              </Link>
              <Divider />
            </>
          )}

          {/* Menu Items */}
          <Flex direction="column" gap={1}>
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{ textDecoration: 'none' }}
                  onClick={handleNavigate}
                >
                  <Box
                    padding={3}
                    rounding={2}
                    color={isActive ? 'secondary' : 'transparent'}
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
                </Link>
              );
            })}
          </Flex>

          <Box marginTop={4}>
            <Divider />
          </Box>

          {/* Settings & Auth */}
          <Box marginTop={4}>
            <Flex direction="column" gap={1}>
              {isAuthenticated && (
                <Link
                  to={ROUTES.SETTINGS}
                  style={{ textDecoration: 'none' }}
                  onClick={handleNavigate}
                >
                  <Box padding={3} rounding={2}>
                    <Flex alignItems="center" gap={3}>
                      <Icon accessibilityLabel="" icon="cog" size={20} color="subtle" />
                      <Text color="subtle">Settings</Text>
                    </Flex>
                  </Box>
                </Link>
              )}

              <TapArea onTap={isAuthenticated ? handleLogout : handleLogin}>
                <Box padding={3} rounding={2}>
                  <Flex alignItems="center" gap={3}>
                    <Icon
                      accessibilityLabel=""
                      icon={isAuthenticated ? 'logout' : 'person'}
                      size={20}
                      color="subtle"
                    />
                    <Text color="subtle">
                      {isAuthenticated ? 'Log out' : 'Log in'}
                    </Text>
                  </Flex>
                </Box>
              </TapArea>
            </Flex>
          </Box>
        </Box>
      </Box>
    </Layer>
  );
};

export default MobileMenu;