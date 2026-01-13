// src/modules/notification/components/NotificationBell.tsx

import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Box, IconButton, Tooltip, Spinner } from 'gestalt';
import { NotificationBadge } from './NotificationBadge';
import { useUnreadCountValue } from '../hooks/useUnreadCount';

// Lazy load dropdown to avoid circular dependency
const NotificationDropdown = lazy(() => import('./NotificationDropdown'));

interface NotificationBellProps {
  size?: 'sm' | 'md' | 'lg';
}

const getIconSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  switch (size) {
    case 'sm': return 'xs';
    case 'lg': return 'lg';
    default: return 'md';
  }
};

const getAccessibilityLabel = (unreadCount: number): string => {
  if (unreadCount > 0) {
    return `Notifications, ${unreadCount} unread`;
  }
  return 'Notifications';
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const unreadCount = useUnreadCountValue();

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setAnchorElement(node);
    }
  }, []);

  const iconSize = getIconSize(size);
  const accessibilityLabel = getAccessibilityLabel(unreadCount);

  return (
    <>
      <Box ref={setAnchorRef} position="relative" display="inlineBlock">
        <Tooltip text="Notifications">
          <IconButton
            accessibilityLabel={accessibilityLabel}
            accessibilityExpanded={isOpen}
            accessibilityHaspopup
            icon="bell"
            onClick={handleToggle}
            size={iconSize}
            bgColor="transparent"
          />
        </Tooltip>

        {unreadCount > 0 && (
          <Box
            position="absolute"
            dangerouslySetInlineStyle={{
              __style: { top: -4, right: -4 },
            }}
          >
            <NotificationBadge count={unreadCount} size="sm" />
          </Box>
        )}
      </Box>

      {isOpen && anchorElement && (
        <Suspense fallback={<Spinner accessibilityLabel="Loading" show />}>
          <NotificationDropdown
            anchor={anchorElement}
            onClose={handleClose}
          />
        </Suspense>
      )}
    </>
  );
};

export default NotificationBell;