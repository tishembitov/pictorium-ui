// src/modules/notification/components/NotificationDropdown.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Popover, TapArea, Tabs, Divider, Icon } from 'gestalt';
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
        <Box paddingX={4} paddingY={3}>
          {/* Title Row */}
          <Flex alignItems="center" justifyContent="between" gap={2}>
            <Flex alignItems="center" gap={2}>
              <Icon 
                accessibilityLabel="" 
                icon="bell" 
                size={20} 
                color="default" 
              />
              <Text weight="bold" size="400">
                Notifications
              </Text>
            </Flex>
            
            {unreadCount > 0 && (
              <Box
                rounding="pill"
                paddingX={2}
                paddingY={1}
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: '#e60023',
                  },
                }}
              >
                <Text size="100" color="inverse" weight="bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </Box>
            )}
          </Flex>
        </Box>

        {/* Mark all as read - separate section */}
        {unreadCount > 0 && (
          <Box paddingX={4} marginBottom={3}>
            <TapArea 
              onTap={handleMarkAllAsRead} 
              disabled={isMarkingAll}
              rounding={2}
            >
              <Box
                padding={2}
                rounding={2}
                color="secondary"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Flex alignItems="center" gap={2}>
                  <Icon 
                    accessibilityLabel="" 
                    icon="check-circle" 
                    size={14} 
                    color={isMarkingAll ? 'subtle' : 'default'}
                  />
                  <Text 
                    size="200" 
                    weight="bold" 
                    color={isMarkingAll ? 'subtle' : 'default'}
                  >
                    {isMarkingAll ? 'Marking all as read...' : 'Mark all as read'}
                  </Text>
                </Flex>
              </Box>
            </TapArea>
          </Box>
        )}

        <Divider />

        {/* Tabs */}
        <Box paddingX={4} paddingY={2}>
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

        <Divider />

        {/* List */}
        <NotificationList
          unreadOnly={activeTab === 'unread'}
          onItemClick={onClose}
          maxHeight={320}
        />

        <Divider />

        {/* Footer */}
        <Box padding={3}>
          <TapArea onTap={handleSeeAll} rounding={2}>
            <Box
              padding={3}
              rounding={2}
              dangerouslySetInlineStyle={{
                __style: {
                  backgroundColor: 'var(--bg-secondary)',
                  transition: 'background-color 0.15s ease',
                },
              }}
            >
              <Flex alignItems="center" justifyContent="center" gap={2}>
                <Text align="center" size="200" weight="bold">
                  See all notifications
                </Text>
                <Icon 
                  accessibilityLabel="" 
                  icon="arrow-forward" 
                  size={12} 
                  color="default"
                />
              </Flex>
            </Box>
          </TapArea>
        </Box>
      </Box>
    </Popover>
  );
};

export default NotificationDropdown;