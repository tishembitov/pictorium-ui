// ================================================
// FILE: src/pages/ProfilePage.tsx
// ================================================
import React from 'react';
import { useParams, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Box, Tabs, Divider, Spinner, Flex, IconButton, Tooltip } from 'gestalt';
import { 
  UserProfileHeader, 
  useUserByUsername,
} from '@/modules/user';
import { useInfinitePins } from '@/modules/pin';
import { useIsOwner } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { buildPath, ROUTES } from '@/app/router/routeConfig';
import ProfileCreatedTab from './ProfileCreatedTab';
import ProfileSavedTab from './ProfileSavedTab';
import ProfileBoardsTab from './ProfileBoardsTab';

type ProfileTab = 'created' | 'saved' | 'boards';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isLoading, isError, error, refetch } = useUserByUsername(username);
  const isOwner = useIsOwner(user?.id);

  // Get pins count
  const { totalElements: pinsCount } = useInfinitePins(
    { authorId: user?.id },
    { enabled: !!user?.id, pageSize: 1 }
  );

  // Determine active tab from URL
  const getActiveTab = (): ProfileTab => {
    if (location.pathname.includes('/saved')) return 'saved';
    if (location.pathname.includes('/boards')) return 'boards';
    return 'created';
  };

  const activeTab = getActiveTab();

  const handleTabChange = ({ activeTabIndex }: { activeTabIndex: number }) => {
    if (!username) return;
    
    const tabs: ProfileTab[] = ['created', 'saved', 'boards'];
    const tab = tabs[activeTabIndex];
    
    switch (tab) {
      case 'saved':
        navigate(buildPath.profileSaved(username));
        break;
      case 'boards':
        navigate(buildPath.profileBoards(username));
        break;
      default:
        navigate(buildPath.profileCreated(username));
    }
  };

  const getTabIndex = (): number => {
    const tabs: ProfileTab[] = ['created', 'saved', 'boards'];
    return tabs.indexOf(activeTab);
  };

  const handleSettings = () => {
    navigate(ROUTES.SETTINGS);
  };

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
          activeTabIndex={getTabIndex()}
          onChange={handleTabChange}
          tabs={[
            { href: buildPath.profileCreated(username), text: 'Created' },
            { href: buildPath.profileSaved(username), text: 'Saved' },
            { href: buildPath.profileBoards(username), text: 'Boards' },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {activeTab === 'created' && <ProfileCreatedTab userId={user.id} />}
        {activeTab === 'saved' && <ProfileSavedTab userId={user.id} isOwner={isOwner} />}
        {activeTab === 'boards' && <ProfileBoardsTab userId={user.id} isOwner={isOwner} />}
      </Box>
    </Box>
  );
};

export default ProfilePage;