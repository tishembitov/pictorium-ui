// src/shared/components/layout/HeaderUserMenu.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  IconButton, 
  Popover, 
  Text, 
  Button,
  Divider,
  Avatar,
  TapArea,
  Flex,
} from 'gestalt';
import { useAuth, useCurrentUser } from '@/modules/auth';
import { ROUTES } from '../../utils/constants';

export const HeaderUserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout } = useAuth();
  const { user, username } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  // Store anchor element in state instead of ref
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleLogin = useCallback(() => {
    login();
  }, [login]);

  const handleLogout = useCallback(() => {
    logout();
    setIsOpen(false);
  }, [logout]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  if (!isAuthenticated) {
    return (
      <Flex gap={2}>
        <Button
          text="Log in"
          color="red"
          onClick={handleLogin}
          size="lg"
        />
      </Flex>
    );
  }

  return (
    <Flex alignItems="center" gap={2}>
      {/* Create Pin Button */}
      <IconButton
        accessibilityLabel="Create pin"
        icon="add"
        onClick={() => navigate(ROUTES.PIN_CREATE)}
        size="md"
      />
      
      {/* Notifications - placeholder */}
      <IconButton
        accessibilityLabel="Notifications"
        icon="bell"
        onClick={() => {}}
        size="md"
      />
      
      {/* Messages - placeholder */}
      <IconButton
        accessibilityLabel="Messages"
        icon="speech"
        onClick={() => {}}
        size="md"
      />
      
      {/* User Avatar & Menu */}
      <Box 
        ref={(node: HTMLDivElement | null) => {
          if (node && !anchorElement) {
            setAnchorElement(node);
          }
        }}
      >
        <TapArea onTap={() => setIsOpen(prev => !prev)} rounding="circle">
          <Avatar
            name={username || 'User'}
            size="sm"
            src={user?.imageId ? `/api/v1/images/${user.imageId}` : undefined}
          />
        </TapArea>
      </Box>
      
      {isOpen && anchorElement && (
        <Popover
          anchor={anchorElement}
          onDismiss={handleClose}
          idealDirection="down"
          positionRelativeToAnchor={false}
          size="md"
          color="white"
        >
          <Box padding={4} width={280}>
            {/* User Info */}
            <Box marginBottom={3}>
              <Text weight="bold" size="300">
                {user?.email}
              </Text>
              <Text color="subtle" size="200">
                @{username}
              </Text>
            </Box>
            
            <Divider />
            
            {/* Menu Items */}
            <Box paddingY={2}>
              <TapArea onTap={() => handleNavigate(`${ROUTES.PROFILE}/${username}`)}>
                <Box padding={2} rounding={2}>
                  <Text size="200">Your profile</Text>
                </Box>
              </TapArea>
              
              <TapArea onTap={() => handleNavigate(ROUTES.SETTINGS)}>
                <Box padding={2} rounding={2}>
                  <Text size="200">Settings</Text>
                </Box>
              </TapArea>
            </Box>
            
            <Divider />
            
            {/* Logout */}
            <Box paddingY={2}>
              <TapArea onTap={handleLogout}>
                <Box padding={2} rounding={2}>
                  <Text size="200">Log out</Text>
                </Box>
              </TapArea>
            </Box>
          </Box>
        </Popover>
      )}
    </Flex>
  );
};

export default HeaderUserMenu;