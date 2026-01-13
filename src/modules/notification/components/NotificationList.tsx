// src/modules/notification/components/NotificationList.tsx

import React from 'react';
import { Box, Flex, Spinner, Text } from 'gestalt';
import { NotificationItem } from './NotificationItem';
import { EmptyState, InfiniteScroll } from '@/shared/components';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationListProps {
  unreadOnly?: boolean;
  onItemClick?: () => void;
  maxHeight?: number | string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  unreadOnly = false,
  onItemClick,
  maxHeight = 400,
}) => {
  const {
    notifications,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useNotifications({ unreadOnly });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading notifications" show />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box padding={4}>
        <Text color="error" align="center">
          Failed to load notifications
        </Text>
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title={unreadOnly ? "You're all caught up!" : "No notifications yet"}
        description={unreadOnly 
          ? "You've read all your notifications" 
          : "When you get notifications, they'll show up here"
        }
        icon="bell"
      />
    );
  }

  return (
    <Box
      overflow="auto"
      dangerouslySetInlineStyle={{
        __style: { maxHeight },
      }}
    >
      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      >
        <Flex direction="column">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={onItemClick}
            />
          ))}
        </Flex>
      </InfiniteScroll>
    </Box>
  );
};

export default NotificationList;