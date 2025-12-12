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
import { ROUTES, buildPath } from '@/app/router/routeConfig';

export const HeaderUserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout } = useAuth();
  const { user, username } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleLogin = useCallback(() => {
    login();
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsOpen(false);
  }, [logout]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  // Callback ref для установки anchor element
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setAnchorElement(node);
    }
  }, []);

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
        bgColor="transparent"
      />
      
      {/* Notifications - placeholder */}
      <IconButton
        accessibilityLabel="Notifications"
        icon="bell"
        onClick={() => {}}
        size="md"
        bgColor="transparent"
      />
      
      {/* Messages - placeholder */}
      <IconButton
        accessibilityLabel="Messages"
        icon="speech"
        onClick={() => {}}
        size="md"
        bgColor="transparent"
      />
      
      {/* User Avatar & Menu */}
      <Box ref={setAnchorRef}>
        <TapArea onTap={handleToggle} rounding="circle">
          <Avatar
            name={username || 'User'}
            size="sm"
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
              <TapArea 
                onTap={() => handleNavigate(buildPath.profile(username || ''))}
                rounding={2}
              >
                <Box padding={2}>
                  <Text size="200">Your profile</Text>
                </Box>
              </TapArea>
              
              <TapArea 
                onTap={() => handleNavigate(ROUTES.SETTINGS)}
                rounding={2}
              >
                <Box padding={2}>
                  <Text size="200">Settings</Text>
                </Box>
              </TapArea>
            </Box>
            
            <Divider />
            
            {/* Logout */}
            <Box paddingY={2}>
              <TapArea onTap={handleLogout} rounding={2}>
                <Box padding={2}>
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