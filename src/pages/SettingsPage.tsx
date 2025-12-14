// ================================================
// FILE: src/pages/SettingsPage.tsx
// ================================================
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
import { useToast } from '@/shared/hooks/useToast';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { useTheme } from '@/shared/hooks/useTheme';
import { buildPath } from '@/app/router/routeConfig';

type SettingsTab = 'profile' | 'account' | 'appearance';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirmModal();
  const { colorScheme, setColorScheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const { user, isLoading, isError, error, refetch } = useUser(authUser?.id);

  const handleProfileUpdateSuccess = () => {
    toast.success('Profile updated successfully!');
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

  const handleDeleteAccount = () => {
    confirm({
      title: 'Delete Account?',
      message: 'This action cannot be undone. All your pins, boards, and data will be permanently deleted.',
      confirmText: 'Delete my account',
      destructive: true,
      onConfirm: () => {
        toast.warning('Account deletion is not yet implemented');
      },
    });
  };

  const handleBack = () => {
    if (user) {
      navigate(buildPath.profile(user.username));
    } else {
      navigate(-1);
    }
  };

  const handleTabChange = ({ activeTabIndex }: { activeTabIndex: number }) => {
    const tabs: SettingsTab[] = ['profile', 'account', 'appearance'];
    setActiveTab(tabs[activeTabIndex] || 'profile');
  };

  const getTabIndex = (): number => {
    const tabs: SettingsTab[] = ['profile', 'account', 'appearance'];
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
    <Box paddingY={4} maxWidth={700} marginStart="auto" marginEnd="auto">
      {/* Header */}
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={3}>
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

      {/* User Preview */}
      <Box marginBottom={4} padding={4} color="secondary" rounding={3}>
        <Flex alignItems="center" gap={3}>
          <UserAvatar
            imageId={user.imageId}
            name={user.username}
            size="lg"
          />
          <Box>
            <Text weight="bold" size="300">{user.username}</Text>
            <Text color="subtle" size="200">{user.email}</Text>
          </Box>
        </Flex>
      </Box>

      {/* Tabs */}
      <Box marginBottom={4}>
        <Tabs
          activeTabIndex={getTabIndex()}
          onChange={handleTabChange}
          tabs={[
            { href: '#profile', text: 'Profile' },
            { href: '#account', text: 'Account' },
            { href: '#appearance', text: 'Appearance' },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={6}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Box>
            <Box marginBottom={4}>
              <Heading size="400" accessibilityLevel={2}>
                Edit Profile
              </Heading>
              <Text color="subtle" size="200">
                Update your profile information
              </Text>
            </Box>

            <UserProfileForm user={user} onSuccess={handleProfileUpdateSuccess} />
          </Box>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <Box>
            <Box marginBottom={6}>
              <Heading size="400" accessibilityLevel={2}>
                Account Information
              </Heading>
            </Box>

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
                    size="lg"
                  />
                </Box>
              </Box>

              <Divider />

              {/* Danger Zone */}
              <Box
                marginTop={4}
                padding={4}
                rounding={2}
                dangerouslySetInlineStyle={{
                  __style: { border: '2px solid var(--color-error)' },
                }}
              >
                <Box marginBottom={3}>
                  <Heading size="300" color="error" accessibilityLevel={3}>
                    Danger Zone
                  </Heading>
                </Box>
                
                <Flex justifyContent="between" alignItems="center">
                  <Box>
                    <Text weight="bold">Delete Account</Text>
                    <Text color="subtle" size="200">
                      Permanently delete your account and all data
                    </Text>
                  </Box>
                  <Button
                    text="Delete Account"
                    color="red"
                    size="sm"
                    onClick={handleDeleteAccount}
                  />
                </Flex>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <Box>
            <Box marginBottom={6}>
              <Heading size="400" accessibilityLevel={2}>
                Appearance
              </Heading>
              <Text color="subtle" size="200">
                Customize how PinThis looks
              </Text>
            </Box>

            <Flex direction="column" gap={4}>
              <Box>
                <Text weight="bold" size="200">Theme</Text>
                <Text color="subtle" size="100">
                  Current: {colorScheme}
                </Text>
                <Box marginTop={2}>
                  <Flex gap={2}>
                    <Button
                      text="Light"
                      onClick={() => setColorScheme('light')}
                      color={colorScheme === 'light' ? 'red' : 'gray'}
                      size="md"
                    />
                    <Button
                      text="Dark"
                      onClick={() => setColorScheme('dark')}
                      color={colorScheme === 'dark' ? 'red' : 'gray'}
                      size="md"
                    />
                    <Button
                      text="System"
                      onClick={() => setColorScheme('userPreference')}
                      color={colorScheme === 'userPreference' ? 'red' : 'gray'}
                      size="md"
                    />
                  </Flex>
                </Box>
              </Box>
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SettingsPage;