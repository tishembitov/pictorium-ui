// src/modules/notification/utils/formatNotification.ts

import type { NotificationResponse, NotificationType } from '../types/notification.types';

interface Actor {
  id: string;
  username: string;
}

interface NotificationTextConfig {
  verb: string;
  icon: string;
  iconColor: string;
}

export const getNotificationConfig = (type: NotificationType): NotificationTextConfig => {
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

/**
 * Форматирует текст уведомления с учётом агрегации
 * 
 * Примеры:
 * - 1 человек: "John liked your pin"
 * - 2 человека: "John and Jane liked your pin"
 * - 3 человека: "John, Jane and Bob liked your pin"
 * - 4+ человек: "John, Jane and 2 others liked your pin"
 */
export const formatNotificationText = (
  notification: NotificationResponse,
  actors: Actor[],
  primaryActorName: string
): { names: string; verb: string } => {
  const config = getNotificationConfig(notification.type);
  const { aggregatedCount, uniqueActorCount } = notification;

  // Для repeatable actions (сообщения, комментарии) - показываем количество
  if (isRepeatableAction(notification.type) && aggregatedCount > 1) {
    const verb = getAggregatedVerb(notification.type, aggregatedCount);
    return { names: primaryActorName, verb };
  }

  // Для single actions (лайки, подписки) - показываем акторов
  if (uniqueActorCount === 1) {
    return { names: primaryActorName, verb: config.verb };
  }

  const sortedActors = getSortedActorNames(notification, actors, primaryActorName);

  if (uniqueActorCount === 2 && sortedActors.length >= 2) {
    return { 
      names: `${sortedActors[0]} and ${sortedActors[1]}`, 
      verb: config.verb 
    };
  }

  if (uniqueActorCount === 3 && sortedActors.length >= 3) {
    return { 
      names: `${sortedActors[0]}, ${sortedActors[1]} and ${sortedActors[2]}`, 
      verb: config.verb 
    };
  }

  // 4+ акторов
  const displayedNames = sortedActors.slice(0, 2).join(', ');
  const othersCount = uniqueActorCount - 2;
  const othersText = othersCount === 1 ? '1 other' : `${othersCount} others`;
  
  return { 
    names: `${displayedNames} and ${othersText}`, 
    verb: config.verb 
  };
};

/**
 * Получает глагол для агрегированных repeatable actions
 */
const getAggregatedVerb = (type: NotificationType, count: number): string => {
  switch (type) {
    case 'NEW_MESSAGE':
      return `sent you ${count} messages`;
    case 'PIN_COMMENTED':
      return `left ${count} comments on your pin`;
    case 'COMMENT_REPLIED':
      return `left ${count} replies to your comment`;
    default:
      return getNotificationConfig(type).verb;
  }
};

/**
 * Проверяет, является ли тип повторяемым действием
 */
const isRepeatableAction = (type: NotificationType): boolean => {
  return type === 'NEW_MESSAGE' || 
         type === 'PIN_COMMENTED' || 
         type === 'COMMENT_REPLIED';
};

/**
 * Сортирует имена акторов: сначала primary, потом recent
 */
const getSortedActorNames = (
  notification: NotificationResponse,
  actors: Actor[],
  primaryActorName: string
): string[] => {
  const actorMap = new Map(actors.map((a) => [a.id, a.username]));
  
  const names: string[] = [primaryActorName];
  
  for (const actorId of notification.recentActorIds) {
    const name = actorMap.get(actorId);
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }
  
  return names;
};