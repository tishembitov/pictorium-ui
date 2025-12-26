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
  Icon,
  TapArea,
} from 'gestalt';
import { UserProfileForm, UserAvatar, useUser } from '@/modules/user';
import { useAuth } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { useToast } from '@/shared/hooks/useToast';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { useTheme, type ColorScheme } from '@/shared/hooks/useTheme';
import { buildPath } from '@/app/router/routeConfig';

type SettingsTab = 'profile' | 'account' | 'appearance';

// Theme option component
interface ThemeOptionProps {
  scheme: ColorScheme;
  currentScheme: ColorScheme;
  label: string;
  description: string;
  icon: 'sun' | 'moon' | 'cog';
  onSelect: (scheme: ColorScheme) => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({
  scheme,
  currentScheme,
  label,
  description,
  icon,
  onSelect,
}) => {
  const isSelected = currentScheme === scheme;
  
  return (
    <TapArea onTap={() => onSelect(scheme)} rounding={3}>
      <Box
        padding={3}
        rounding={3}
        borderStyle={isSelected ? 'lg' : 'sm'}
        dangerouslySetInlineStyle={{
          __style: {
            borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-default)',
            backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          <Box
            padding={2}
            rounding="circle"
            color={isSelected ? 'default' : 'secondary'}
          >
            <Icon
              accessibilityLabel={label}
              icon={icon}
              size={20}
              color={isSelected ? 'brandPrimary' : 'subtle'}
            />
          </Box>
          <Box flex="grow">
            <Text weight="bold" size="200">
              {label}
            </Text>
            <Text color="subtle" size="100">
              {description}
            </Text>
          </Box>
          {isSelected && (
            <Icon
              accessibilityLabel="Selected"
              icon="check-circle"
              size={20}
              color="success"
            />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

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

  const handleLogout = () => {
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
    setActiveTab(tabs[activeTabIndex] ?? 'profile');
  };

  const getTabIndex = (): number => {
    const tabs: SettingsTab[] = ['profile', 'account', 'appearance'];
    return tabs.indexOf(activeTab);
  };

  const handleThemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    const themeName = scheme === 'userPreference' ? 'System' : scheme;
    toast.success(`Theme changed to ${themeName}`);
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
          message={error?.message ?? 'Please try again'}
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
            { href: '#account', text: 'Account' },
            { href: '#appearance', text: 'Appearance' },
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

              {/* Danger Zone */}
              <Box
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
              </Box>
            </Flex>
          </Box>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <Box>
            <Box marginBottom={4}>
              <Text weight="bold" size="300">
                Theme
              </Text>
              <Text color="subtle" size="200">
                Choose how Pictorium looks to you
              </Text>
            </Box>

            <Flex direction="column" gap={2}>
              <ThemeOption
                scheme="light"
                currentScheme={colorScheme}
                label="Light"
                description="Always use light mode"
                icon="sun"
                onSelect={handleThemeChange}
              />
              
              <ThemeOption
                scheme="dark"
                currentScheme={colorScheme}
                label="Dark"
                description="Always use dark mode"
                icon="moon"
                onSelect={handleThemeChange}
              />
              
              <ThemeOption
                scheme="userPreference"
                currentScheme={colorScheme}
                label="System"
                description="Match your device settings"
                icon="cog"
                onSelect={handleThemeChange}
              />
            </Flex>

            {/* Preview hint */}
            <Box marginTop={4} padding={3} color="secondary" rounding={2}>
              <Flex alignItems="center" gap={2}>
                <Icon
                  accessibilityLabel="Info"
                  icon="info-circle"
                  size={16}
                  color="subtle"
                />
                <Text size="100" color="subtle">
                  {colorScheme === 'userPreference' 
                    ? 'Theme will automatically change based on your system preferences'
                    : `Using ${colorScheme} theme`
                  }
                </Text>
              </Flex>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SettingsPage;