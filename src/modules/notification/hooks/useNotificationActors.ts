// src/modules/notification/hooks/useNotificationActors.ts

import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { userApi } from '@/modules/user';
import type { NotificationResponse } from '../types/notification.types';

interface Actor {
  id: string;
  username: string;
  imageId: string | null;
}

interface UseNotificationActorsResult {
  actors: Actor[];
  isLoading: boolean;
  primaryActor: Actor | undefined;
}

/**
 * Загружает информацию об акторах уведомления
 */
export const useNotificationActors = (
  notification: NotificationResponse
): UseNotificationActorsResult => {
  // Собираем все уникальные ID акторов
  const actorIds = [
    notification.actorId,
    ...notification.recentActorIds,
  ].filter((id, index, self) => id && self.indexOf(id) === index);

  const queries = useQueries({
    queries: actorIds.map((actorId) => ({
      queryKey: queryKeys.users.byId(actorId),
      queryFn: () => userApi.getById(actorId),
      staleTime: 1000 * 60 * 5, // 5 минут
      enabled: !!actorId,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const actors: Actor[] = queries
    .filter((q) => q.data)
    .map((q) => ({
      id: q.data!.id,
      username: q.data!.username || 'Someone',
      imageId: q.data!.imageId || null,
    }));

  // Первый актор (последний кто совершил действие)
  const primaryActor = actors.find((a) => a.id === notification.actorId);

  return {
    actors,
    isLoading,
    primaryActor,
  };
};

export default useNotificationActors;