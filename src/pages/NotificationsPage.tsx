// src/pages/NotificationsPage.tsx

import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Button, Tabs, Divider, Spinner } from 'gestalt';
import { NotificationItem , useNotifications, useMarkAllAsRead, useUnreadCountValue } from '@/modules/notification';
import { EmptyState, InfiniteScroll } from '@/shared/components';

type TabType = 'all' | 'unread';

// ✅ Константы вместо функций с булевым параметром
const EMPTY_STATE_CONFIG = {
  all: {
    title: 'No notifications yet',
    description: "When you get notifications, they'll show up here",
  },
  unread: {
    title: "You're all caught up!",
    description: "You've read all your notifications",
  },
} as const;

// Helper to get description text
const getDescriptionText = (totalElements: number): string => {
  if (totalElements === 0) {
    return 'No notifications';
  }
  if (totalElements === 1) {
    return '1 notification';
  }
  return `${totalElements} notifications`;
};

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const unreadOnly = activeTab === 'unread';
  
  const {
    notifications,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useNotifications({ unreadOnly });

  const { markAllAsRead, isLoading: isMarkingAll } = useMarkAllAsRead();
  const unreadCount = useUnreadCountValue();

  const handleTabChange = ({ activeTabIndex }: { activeTabIndex: number }) => {
    setActiveTab(activeTabIndex === 0 ? 'all' : 'unread');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRetry = () => {
    globalThis.location.reload();
  };

  // ✅ Получаем конфиг напрямую по ключу activeTab
  const emptyStateConfig = EMPTY_STATE_CONFIG[activeTab];

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" padding={8}>
          <Spinner accessibilityLabel="Loading notifications" show size="lg" />
        </Box>
      );
    }

    if (isError) {
      return (
        <EmptyState
          title="Failed to load notifications"
          description="Please try again later"
          icon="workflow-status-problem"
          action={{
            text: 'Retry',
            onClick: handleRetry,
          }}
        />
      );
    }

    if (notifications.length === 0) {
      return (
        <EmptyState
          title={emptyStateConfig.title}
          description={emptyStateConfig.description}
          icon="bell"
        />
      );
    }

    return (
      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      >
        <Flex direction="column" gap={1}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </Flex>
      </InfiniteScroll>
    );
  };

  const unreadTabText = unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread';
  const markAllButtonText = isMarkingAll ? 'Marking...' : 'Mark all as read';

  return (
    <Box paddingY={6}>
      {/* Header */}
      <Box marginBottom={6}>
        <Flex alignItems="center" justifyContent="between">
          <Flex direction="column" gap={1}>
            <Heading size="400">Notifications</Heading>
            <Text color="subtle">
              {getDescriptionText(totalElements)}
            </Text>
          </Flex>
          
          {unreadCount > 0 && (
            <Button
              text={markAllButtonText}
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              size="lg"
              color="gray"
            />
          )}
        </Flex>
      </Box>

      {/* Tabs */}
      <Box marginBottom={4}>
        <Tabs
          activeTabIndex={activeTab === 'all' ? 0 : 1}
          onChange={handleTabChange}
          tabs={[
            { href: '#', text: 'All' },
            { href: '#', text: unreadTabText },
          ]}
          wrap
        />
      </Box>

      <Divider />

      {/* Content */}
      <Box marginTop={4}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default NotificationsPage;