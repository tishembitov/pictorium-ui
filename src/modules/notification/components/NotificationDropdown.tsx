// src/modules/notification/components/NotificationDropdown.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Popover, TapArea, Tabs } from 'gestalt';
import { NotificationList } from './NotificationList';
import { useMarkAllAsRead } from '../hooks/useMarkAsRead';
import { useUnreadCountValue } from '../hooks/useUnreadCount';
import { ROUTES } from '@/app/router/routes';

interface NotificationDropdownProps {
  anchor: HTMLElement;
  onClose: () => void;
}

type TabType = 'all' | 'unread';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  anchor,
  onClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { markAllAsRead, isLoading: isMarkingAll } = useMarkAllAsRead();
  const unreadCount = useUnreadCountValue();

  const handleTabChange = ({ activeTabIndex }: { activeTabIndex: number }) => {
    setActiveTab(activeTabIndex === 0 ? 'all' : 'unread');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleSeeAll = () => {
    navigate(ROUTES.NOTIFICATIONS);
    onClose();
  };

  return (
    <Popover
      anchor={anchor}
      onDismiss={onClose}
      idealDirection="down"
      positionRelativeToAnchor={false}
      size="xl"
      color="white"
    >
      <Box width={400}>
        {/* Header */}
        <Box padding={3} color="secondary">
          <Flex alignItems="center" justifyContent="between">
            <Text weight="bold" size="300">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <TapArea onTap={handleMarkAllAsRead} disabled={isMarkingAll}>
                <Text size="100" color="subtle">
                  {isMarkingAll ? 'Marking...' : 'Mark all as read'}
                </Text>
              </TapArea>
            )}
          </Flex>
        </Box>

        {/* Tabs */}
        <Box paddingX={3}>
          <Tabs
            activeTabIndex={activeTab === 'all' ? 0 : 1}
            onChange={handleTabChange}
            tabs={[
              { href: '#', text: 'All' },
              { 
                href: '#', 
                text: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' 
              },
            ]}
            wrap
          />
        </Box>

        {/* List */}
        <NotificationList
          unreadOnly={activeTab === 'unread'}
          onItemClick={onClose}
          maxHeight={400}
        />

        {/* Footer */}
        <Box padding={3} color="secondary">
          <TapArea onTap={handleSeeAll}>
            <Text align="center" size="200" color="subtle">
              See all notifications
            </Text>
          </TapArea>
        </Box>
      </Box>
    </Popover>
  );
};

export default NotificationDropdown;