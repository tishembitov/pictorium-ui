// src/modules/notification/components/NotificationPopup.tsx

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Icon, IconButton, Layer, TapArea } from 'gestalt';
import { UserAvatar } from '@/modules/user';
import { useImageUrl } from '@/modules/storage';
import { buildPath } from '@/app/router/routes';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { getNotificationConfig } from '../utils/formatNotification';
import type { NotificationResponse } from '../types/notification.types';

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

/**
 * Форматирует глагол для popup с учётом агрегации
 */
const getPopupVerb = (notification: NotificationResponse): string => {
  const { type, aggregatedCount } = notification;
  const config = getNotificationConfig(type);

  // Для repeatable actions показываем количество
  if (aggregatedCount > 1) {
    switch (type) {
      case 'NEW_MESSAGE':
        return `sent you ${aggregatedCount} messages`;
      case 'PIN_COMMENTED':
        return `left ${aggregatedCount} comments`;
      case 'COMMENT_REPLIED':
        return `left ${aggregatedCount} replies`;
    }
  }

  // Для single actions - просто глагол, имена уже в actorName
  return config.verb;
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

  const config = useMemo(
    () => getNotificationConfig(notification.type),
    [notification.type]
  );

  const verb = useMemo(() => getPopupVerb(notification), [notification]);

  const link = useMemo(
    () => getNotificationLink(notification, actorUsername),
    [notification, actorUsername]
  );

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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

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
    if (notification.status === 'UNREAD') {
      markAsRead([notification.id]);
    }

    if (link) {
      navigate(link);
    }
    closePopup();
  }, [notification, markAsRead, link, navigate, closePopup]);

  const handleCloseClick = useCallback(
    (event: { event: React.SyntheticEvent }) => {
      event.event.stopPropagation();
      closePopup();
    },
    [closePopup]
  );

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
            transform:
              isVisible && !isLeaving
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
                boxShadow:
                  '0 4px 24px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
                borderLeft: `4px solid ${config.iconColor}`,
              },
            }}
          >
            <Flex gap={3} alignItems="start">
              {/* Actor Avatar with badges */}
              <Box
                position="relative"
                dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}
              >
                <UserAvatar imageId={actorImageId} name={actorName} size="md" />

                {/* Badge for multiple actors */}
                {notification.uniqueActorCount > 1 && (
                  <Box
                    position="absolute"
                    dangerouslySetInlineStyle={{
                      __style: {
                        top: -4,
                        right: -4,
                        backgroundColor: '#e60023',
                        borderRadius: '50%',
                        minWidth: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        border: '2px solid white',
                      },
                    }}
                  >
                    <Text size="100" color="inverse" weight="bold">
                      {notification.uniqueActorCount > 9
                        ? '9+'
                        : notification.uniqueActorCount}
                    </Text>
                  </Box>
                )}

                {/* Type icon */}
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
                    icon={config.icon as GestaltIconName}
                    size={12}
                    color="inverse"
                  />
                </Box>
              </Box>

              {/* Content */}
              <Box flex="grow" minWidth={0}>
                <Flex direction="column" gap={1}>
                  <Text size="200" overflow="breakWord">
                    <Text weight="bold" inline>
                      {actorName}
                    </Text>{' '}
                    {verb}
                  </Text>

                  {notification.previewText && (
                    <Text size="100" color="subtle" lineClamp={2}>
                      "{notification.previewText}"
                    </Text>
                  )}

                  <Text size="100" color="subtle">
                    {formatShortRelativeTime(notification.updatedAt)}
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