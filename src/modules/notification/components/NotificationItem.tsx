// src/modules/notification/components/NotificationItem.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, TapArea, Icon, IconButton } from 'gestalt';
import { UserAvatar } from '@/modules/user';
import { useImageUrl } from '@/modules/storage';
import { buildPath } from '@/app/router/routes';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useDeleteNotification } from '../hooks/useDeleteNotification';
import { useNotificationItemLocalState } from '../hooks/useNotificationItemLocalState';
import { useNotificationActors } from '../hooks/useNotificationActors';
import { getNotificationConfig, formatNotificationText } from '../utils/formatNotification';
import type { NotificationResponse } from '../types/notification.types';

interface NotificationItemProps {
  notification: NotificationResponse;
  onClose?: () => void;
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

const getBackgroundColor = (isUnread: boolean, isHovered: boolean): string => {
  if (isUnread) {
    return 'var(--color-primary-light)';
  }
  if (isHovered) {
    return 'var(--bg-secondary)';
  }
  return 'transparent';
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Загружаем всех акторов
  const { actors, primaryActor } = useNotificationActors(notification);

  const { data: previewImage } = useImageUrl(notification.previewImageId, {
    enabled: !!notification.previewImageId,
  });

  const {
    state: localState,
    markAsRead: localMarkAsRead,
    markAsDeleted: localMarkAsDeleted,
    resetOverride,
  } = useNotificationItemLocalState(notification);

  const { markAsRead } = useMarkAsRead({
    onError: () => resetOverride(),
  });

  const { deleteNotification, isLoading: isDeleting } = useDeleteNotification({
    onError: () => resetOverride(),
  });

  const config = useMemo(
    () => getNotificationConfig(notification.type),
    [notification.type]
  );

  const primaryActorName = primaryActor?.username || 'Someone';

  // Форматируем текст с учётом агрегации
  const { names, verb } = useMemo(
    () => formatNotificationText(notification, actors, primaryActorName),
    [notification, actors, primaryActorName]
  );

  const link = useMemo(
    () => getNotificationLink(notification, primaryActor?.username),
    [notification, primaryActor?.username]
  );

  const isUnread = localState.status === 'UNREAD';

  const handleClick = useCallback(() => {
    if (isUnread) {
      localMarkAsRead();
      markAsRead([notification.id]);
    }

    if (link) {
      navigate(link);
      onClose?.();
    }
  }, [isUnread, localMarkAsRead, markAsRead, notification.id, link, navigate, onClose]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      localMarkAsDeleted();
      deleteNotification(notification.id);
    },
    [localMarkAsDeleted, deleteNotification, notification.id]
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  if (localState.isDeleted) {
    return null;
  }

  const backgroundColor = getBackgroundColor(isUnread, isHovered);

  // Показываем время updatedAt для агрегированных уведомлений
  const displayTime = notification.aggregatedCount > 1 
    ? notification.updatedAt 
    : notification.createdAt;

  return (
    <TapArea onTap={handleClick} rounding={2}>
      <Box
        padding={3}
        rounding={2}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor,
            transition: 'background-color 0.15s ease',
            opacity: isDeleting ? 0.5 : 1,
          },
        }}
      >
        <Flex gap={3} alignItems="start">
          {/* Actor Avatar with type icon */}
          <Box
            position="relative"
            dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}
          >
            <UserAvatar 
              imageId={primaryActor?.imageId} 
              name={primaryActorName} 
              size="md" 
            />
            
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
                  {notification.uniqueActorCount > 9 ? '9+' : notification.uniqueActorCount}
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
                  padding: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
                  {names}
                </Text>{' '}
                {verb}
              </Text>

              {notification.previewText && (
                <Text size="100" color="subtle" lineClamp={2}>
                  {notification.previewText}
                </Text>
              )}

              <Text size="100" color="subtle">
                {formatShortRelativeTime(displayTime)}
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

          {/* Delete button on hover */}
          {isHovered && (
            <Box dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}>
              <IconButton
                accessibilityLabel="Delete notification"
                icon="trash-can"
                size="xs"
                onClick={(e) =>
                  handleDelete(e.event as unknown as React.MouseEvent)
                }
                bgColor="transparent"
                disabled={isDeleting}
              />
            </Box>
          )}

          {/* Unread indicator */}
          {isUnread && !isHovered && (
            <Box
              rounding="circle"
              dangerouslySetInlineStyle={{
                __style: {
                  width: 8,
                  height: 8,
                  backgroundColor: 'var(--color-primary)',
                  flexShrink: 0,
                  marginTop: 6,
                },
              }}
            />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export default NotificationItem;