// src/pages/SettingsPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Divider, 
  Spinner, 
  Text, 
  Flex, 
  Button,
  IconButton,
  Tooltip,
  Tabs,
} from 'gestalt';
import { UserProfileForm, UserAvatar, useUser } from '@/modules/user';
import { useAuth } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
// import { useTheme } from '@/shared/hooks/useTheme';
import { buildPath } from '@/app/router/routes';

type SettingsTab = 'profile' | 'account' ;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const { confirm } = useConfirmModal();
  // const { colorScheme, setColorScheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const { user, isLoading, isError, error, refetch } = useUser(authUser?.id);

  const handleProfileUpdateSuccess = () => {
    refetch();
  };

  const handleLogout = async () => {
    confirm({
      title: 'Log out?',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      onConfirm: async () => {
        await logout();
      },
    });
  };

  // const handleDeleteAccount = () => {
  //   confirm({
  //     title: 'Delete Account?',
  //     message: 'This action cannot be undone. All your pins, boards, and data will be permanently deleted.',
  //     confirmText: 'Delete my account',
  //     destructive: true,
  //     onConfirm: () => {
  //       toast.warning('Account deletion is not yet implemented');
  //     },
  //   });
  // };

  const handleBack = () => {
    if (user) {
      navigate(buildPath.profile(user.username));
    } else {
      navigate(-1);
    }
  };

  const handleTabChange = ({ activeTabIndex }: { activeTabIndex: number }) => {
    const tabs: SettingsTab[] = ['profile', 'account'];
    setActiveTab(tabs[activeTabIndex] || 'profile');
  };

  const getTabIndex = (): number => {
    const tabs: SettingsTab[] = ['profile', 'account'];
    return tabs.indexOf(activeTab);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading settings" show size="lg" />
      </Box>
    );
  }

  if (isError || !user) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="Failed to load settings"
          message={error?.message || 'Please try again'}
          onRetry={() => refetch()}
        />
      </Box>
    );
  }

  return (
    <Box 
      paddingY={4} 
      maxWidth={700} 
      marginStart="auto" 
      marginEnd="auto"
    >
      {/* Header */}
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={2}>
          <Tooltip text="Go back">
            <IconButton
              accessibilityLabel="Go back"
              icon="arrow-back"
              onClick={handleBack}
              size="md"
              bgColor="transparent"
            />
          </Tooltip>
          <Heading size="400" accessibilityLevel={1}>
            Settings
          </Heading>
        </Flex>
      </Box>

      {/* User Preview Card */}
      <Box marginBottom={4} padding={3} color="secondary" rounding={3}>
        <Flex alignItems="center" gap={3}>
          <UserAvatar
            imageId={user.imageId}
            name={user.username}
            size="md"
          />
          <Box>
            <Text weight="bold" size="200">{user.username}</Text>
            <Text color="subtle" size="100">{user.email}</Text>
          </Box>
        </Flex>
      </Box>

      {/* Tabs */}
      <Box marginBottom={3}>
        <Tabs
          activeTabIndex={getTabIndex()}
          onChange={handleTabChange}
          tabs={[
            { href: '#profile', text: 'Edit Profile' },
            { href: '#account', text: 'Account' }
            // { href: '#appearance', text: 'Appearance' },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={5}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <UserProfileForm user={user} onSuccess={handleProfileUpdateSuccess} />
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <Box>
            <Flex direction="column" gap={4}>
              <Box>
                <Text weight="bold" size="200">Email</Text>
                <Text color="subtle">{user.email}</Text>
              </Box>

              <Box>
                <Text weight="bold" size="200">User ID</Text>
                <Text color="subtle" size="100">{user.id}</Text>
              </Box>

              <Divider />

              <Box>
                <Text weight="bold" size="200">Session</Text>
                <Box marginTop={2}>
                  <Button
                    text="Log out"
                    onClick={handleLogout}
                    color="gray"
                    size="md"
                  />
                </Box>
              </Box>

              <Divider />

              {/* /Danger Zone */}
              {/* <Box
                padding={4}
                rounding={2}
                dangerouslySetInlineStyle={{
                  __style: { border: '1px solid var(--color-error)' },
                }}
              >
                <Box marginBottom={2}>
                  <Text weight="bold" color="error" size="200">
                    Danger Zone
                  </Text>
                </Box>
                
                <Flex justifyContent="between" alignItems="center" gap={4} wrap>
                  <Box>
                    <Text weight="bold" size="200">Delete Account</Text>
                    <Text color="subtle" size="100">
                      Permanently delete your account
                    </Text>
                  </Box>
                  <Button
                    text="Delete"
                    color="red"
                    size="sm"
                    onClick={handleDeleteAccount}
                  />
                </Flex>
              </Box> */}
            </Flex>
          </Box>
        )}

        {/* Appearance Tab */}
        {/* {activeTab === 'appearance' && (
          <Box>
            <Flex direction="column" gap={4}>
              <Box>
                <Text weight="bold" size="200">Theme</Text>
                <Box marginTop={1} marginBottom={2}>
                  <Text color="subtle" size="100">
                    Current: {colorScheme === 'userPreference' ? 'System' : colorScheme}
                  </Text>
                </Box>
                <Flex gap={2}>
                  <Button
                    text="Light"
                    onClick={() => setColorScheme('light')}
                    color={colorScheme === 'light' ? 'red' : 'gray'}
                    size="sm"
                  />
                  <Button
                    text="Dark"
                    onClick={() => setColorScheme('dark')}
                    color={colorScheme === 'dark' ? 'red' : 'gray'}
                    size="sm"
                  />
                  <Button
                    text="System"
                    onClick={() => setColorScheme('userPreference')}
                    color={colorScheme === 'userPreference' ? 'red' : 'gray'}
                    size="sm"
                  />
                </Flex>
              </Box>
            </Flex>
          </Box>
        )} */}
      </Box>
    </Box>
  );
};

export default SettingsPage;