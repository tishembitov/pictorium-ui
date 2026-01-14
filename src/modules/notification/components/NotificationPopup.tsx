// src/modules/notification/components/NotificationPopup.tsx

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Icon, IconButton, Layer, TapArea } from 'gestalt';
import { UserAvatar } from '@/modules/user';
import { useImageUrl } from '@/modules/storage';
import { buildPath } from '@/app/router/routes';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import type { NotificationResponse, NotificationType } from '../types/notification.types';

interface NotificationPopupProps {
  notification: NotificationResponse;
  actorName: string;
  actorUsername?: string;
  actorImageId?: string | null;
  onClose: () => void;
  duration?: number;
  index?: number;
}

type GestaltIconName = React.ComponentProps<typeof Icon>['icon'];

interface NotificationConfig {
  icon: GestaltIconName;
  verb: string;
  iconColor: string;
}

const getNotificationConfig = (type: NotificationType): NotificationConfig => {
  switch (type) {
    case 'PIN_LIKED':
      return { icon: 'heart', verb: 'liked your pin', iconColor: '#e60023' };
    case 'PIN_COMMENTED':
      return { icon: 'speech', verb: 'commented on your pin', iconColor: '#0074e8' };
    case 'PIN_SAVED':
      return { icon: 'pin', verb: 'saved your pin', iconColor: '#0a7c42' };
    case 'COMMENT_LIKED':
      return { icon: 'heart', verb: 'liked your comment', iconColor: '#e60023' };
    case 'COMMENT_REPLIED':
      return { icon: 'speech', verb: 'replied to your comment', iconColor: '#0074e8' };
    case 'USER_FOLLOWED':
      return { icon: 'person-add', verb: 'started following you', iconColor: '#8e44ad' };
    case 'NEW_MESSAGE':
      return { icon: 'speech', verb: 'sent you a message', iconColor: '#0074e8' };
    default:
      return { icon: 'bell', verb: 'sent you a notification', iconColor: '#111111' };
  }
};

const getNotificationLink = (
  notification: NotificationResponse,
  actorUsername?: string
): string | null => {
  const { type, referenceId } = notification;

  switch (type) {
    case 'PIN_LIKED':
    case 'PIN_COMMENTED':
    case 'PIN_SAVED':
    case 'COMMENT_LIKED':
    case 'COMMENT_REPLIED':
      return referenceId ? buildPath.pin(referenceId) : null;
    case 'USER_FOLLOWED':
      return actorUsername ? buildPath.profile(actorUsername) : null;
    case 'NEW_MESSAGE':
      return referenceId ? buildPath.messages(referenceId) : null;
    default:
      return null;
  }
};

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  actorName,
  actorUsername,
  actorImageId,
  onClose,
  duration = 5000,
  index = 0,
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { markAsRead } = useMarkAsRead();

  const { data: previewImage } = useImageUrl(notification.previewImageId, {
    enabled: !!notification.previewImageId,
  });

  const config = useMemo(() => getNotificationConfig(notification.type), [notification.type]);
  const link = useMemo(
    () => getNotificationLink(notification, actorUsername),
    [notification, actorUsername]
  );

  // Close handler
  const closePopup = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-close (pause on hover)
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Don't start timer if hovered
    if (isHovered) {
      return;
    }

    timerRef.current = setTimeout(() => {
      closePopup();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [duration, isHovered, closePopup]);

  const handleClick = useCallback(() => {
    // Mark as read
    if (notification.status === 'UNREAD') {
      markAsRead([notification.id]);
    }

    if (link) {
      navigate(link);
    }
    closePopup();
  }, [notification, markAsRead, link, navigate, closePopup]);

  const handleCloseClick = useCallback((event: { event: React.SyntheticEvent }) => {
    event.event.stopPropagation();
    closePopup();
  }, [closePopup]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const topOffset = 20 + index * 100;

  return (
    <Layer>
      <Box
        position="fixed"
        dangerouslySetInlineStyle={{
          __style: {
            top: topOffset,
            right: 20,
            zIndex: 1000 - index,
            transform: isVisible && !isLeaving 
              ? 'translateX(0) scale(1)' 
              : 'translateX(120%) scale(0.95)',
            opacity: isVisible && !isLeaving ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          },
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <TapArea onTap={handleClick} rounding={3}>
          <Box
            width={360}
            padding={4}
            rounding={3}
            color="default"
            dangerouslySetInlineStyle={{
              __style: {
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
                borderLeft: `4px solid ${config.iconColor}`,
              },
            }}
          >
            <Flex gap={3} alignItems="start">
              {/* Actor Avatar with type icon */}
              <Box position="relative" dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}>
                <UserAvatar
                  imageId={actorImageId}
                  name={actorName}
                  size="md"
                />
                <Box
                  position="absolute"
                  dangerouslySetInlineStyle={{
                    __style: {
                      bottom: -2,
                      right: -2,
                      backgroundColor: config.iconColor,
                      borderRadius: '50%',
                      padding: 4,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <Icon
                    accessibilityLabel=""
                    icon={config.icon}
                    size={12}
                    color="inverse"
                  />
                </Box>
              </Box>

              {/* Content */}
              <Box flex="grow" minWidth={0}>
                <Flex direction="column" gap={1}>
                  <Text size="200" overflow="breakWord">
                    <Text weight="bold" inline>{actorName}</Text>
                    {' '}
                    {config.verb}
                  </Text>

                  {notification.previewText && (
                    <Text size="100" color="subtle" lineClamp={2}>
                      "{notification.previewText}"
                    </Text>
                  )}

                  <Text size="100" color="subtle">
                    {formatShortRelativeTime(notification.createdAt)}
                  </Text>
                </Flex>
              </Box>

              {/* Preview Image */}
              {previewImage?.url && (
                <Box
                  width={48}
                  height={48}
                  rounding={2}
                  overflow="hidden"
                  dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}
                >
                  <img
                    src={previewImage.url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              )}

              {/* Close button */}
              <Box dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}>
                <IconButton
                  accessibilityLabel="Close notification"
                  icon="cancel"
                  size="xs"
                  onClick={handleCloseClick}
                  bgColor="transparent"
                />
              </Box>
            </Flex>
          </Box>
        </TapArea>
      </Box>
    </Layer>
  );
};

export default NotificationPopup;