// src/pages/ProfilePage.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Box, Tabs, Divider, Spinner, Flex, IconButton, Tooltip } from 'gestalt';
import { 
  UserProfileHeader, 
  useUserByUsername,
} from '@/modules/user';
import { useInfinitePins } from '@/modules/pin';
import { useIsOwner } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { ROUTES } from '@/app/router/routeConfig';
import ProfileCreatedTab from './ProfileCreatedTab';
import ProfileLikedTab from './ProfileLikedTab';
import ProfileBoardsTab from './ProfileBoardsTab';

type ProfileTab = 'created' | 'liked' | 'boards';

const TABS: { id: ProfileTab; text: string }[] = [
  { id: 'created', text: 'Created' },
  { id: 'liked', text: 'Liked' },
  { id: 'boards', text: 'Boards' },
];

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('created');

  const { user, isLoading, isError, error, refetch } = useUserByUsername(username);
  const isOwner = useIsOwner(user?.id);

  // Get pins count for header
  const { totalElements: pinsCount } = useInfinitePins(
    { authorId: user?.id },
    { enabled: !!user?.id, pageSize: 1 }
  );

  const handleTabChange = useCallback(({ activeTabIndex }: { activeTabIndex: number }) => {
    const tab = TABS[activeTabIndex];
    if (tab) {
      setActiveTab(tab.id);
    }
  }, []);

  const activeTabIndex = useMemo(() => {
    return TABS.findIndex((tab) => tab.id === activeTab);
  }, [activeTab]);

  const handleSettings = useCallback(() => {
    navigate(ROUTES.SETTINGS);
  }, [navigate]);

  // Memoized tab content
  const tabContent = useMemo(() => {
    if (!user) return null;
    
    switch (activeTab) {
      case 'created':
        return <ProfileCreatedTab userId={user.id} isOwner={isOwner} />;
      case 'liked':
        return <ProfileLikedTab userId={user.id} isOwner={isOwner} />;
      case 'boards':
        return <ProfileBoardsTab userId={user.id} isOwner={isOwner} />;
      default:
        return null;
    }
  }, [activeTab, user, isOwner]);

  if (!username) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading profile" show size="lg" />
      </Box>
    );
  }

  if (isError || !user) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="User not found"
          message={error?.message || `User @${username} doesn't exist`}
          onRetry={() => refetch()}
        />
      </Box>
    );
  }

  return (
    <Box paddingY={4}>
      {/* Quick Actions for Owner */}
      {isOwner && (
        <Box marginBottom={2}>
          <Flex justifyContent="end">
            <Tooltip text="Settings">
              <IconButton
                accessibilityLabel="Settings"
                icon="cog"
                onClick={handleSettings}
                size="md"
                bgColor="transparent"
              />
            </Tooltip>
          </Flex>
        </Box>
      )}

      {/* Profile Header */}
      <UserProfileHeader user={user} pinsCount={pinsCount} />

      {/* Tabs */}
      <Box marginTop={6}>
        <Tabs
          activeTabIndex={activeTabIndex}
          onChange={handleTabChange}
          tabs={TABS.map((tab) => ({ 
            href: `#${tab.id}`,
            text: tab.text,
          }))}
          wrap
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box 
        marginTop={4}
        dangerouslySetInlineStyle={{
          __style: {
            minHeight: '400px',
          },
        }}
      >
        {tabContent}
      </Box>
    </Box>
  );
};

export default ProfilePage;