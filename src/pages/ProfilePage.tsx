// src/pages/ProfilePage.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Divider, Spinner, Flex, IconButton, Tooltip } from 'gestalt';
import { 
  UserProfileHeader, 
  useUserByUsername,
} from '@/modules/user';
import { useIsOwner } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { ROUTES } from '@/app/router/routes';
import ProfilePinsTab from './ProfilePinsTab';
import ProfileBoardsTab from './ProfileBoardsTab';

type ProfileTab = 'pins' | 'boards';

const TABS: { id: ProfileTab; text: string }[] = [
  { id: 'pins', text: 'Pins' },
  { id: 'boards', text: 'Boards' },
];

// ✅ Функция для получения таба из hash
const getTabFromHash = (hash: string): ProfileTab => {
  const normalizedHash = hash.replace('#', '').toLowerCase();
  if (normalizedHash === 'boards') return 'boards';
  return 'pins';
};

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Используем useMemo для вычисления таба из hash
  const tabFromHash = useMemo(() => getTabFromHash(location.hash), [location.hash]);
  
  // ✅ Локальный state только для случаев, когда пользователь кликает на таб
  // Приоритет: hash из URL
  const [localTab, setLocalTab] = useState<ProfileTab | null>(null);
  
  // ✅ Финальный активный таб: localTab если установлен и hash не изменился, иначе из hash
  const activeTab = localTab ?? tabFromHash;

  const { user, isLoading, isError, error, refetch } = useUserByUsername(username);
  const isOwner = useIsOwner(user?.id);

  // ✅ Сбрасываем localTab при изменении hash (например, при навигации)
  const handleTabChange = useCallback(({ activeTabIndex }: { activeTabIndex: number }) => {
    const tab = TABS[activeTabIndex];
    if (tab) {
      setLocalTab(tab.id);
      // Обновляем hash в URL без перезагрузки
      navigate(`${location.pathname}#${tab.id}`, { replace: true });
    }
  }, [navigate, location.pathname]);

  const activeTabIndex = useMemo(() => {
    return TABS.findIndex((tab) => tab.id === activeTab);
  }, [activeTab]);

  const handleSettings = useCallback(() => {
    navigate(ROUTES.SETTINGS);
  }, [navigate]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Memoized tab content
  const tabContent = useMemo(() => {
    if (!user) return null;
    
    switch (activeTab) {
      case 'pins':
        return <ProfilePinsTab userId={user.id} isOwner={isOwner} />;
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
          onRetry={handleRetry}
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
      <UserProfileHeader user={user} />

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