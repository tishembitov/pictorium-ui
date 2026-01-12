// src/modules/chat/hooks/usePresence.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { presenceApi } from '../api/presenceApi';
import type { PresenceStatus } from '../types/chat.types';

interface UsePresenceOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to get full presence data for a single user
 */
export const useUserPresence = (
  userId: string | null | undefined, 
  options: UsePresenceOptions = {}
) => {
  const { enabled = true, refetchInterval = 30000 } = options;

  const query = useQuery({
    queryKey: queryKeys.presence.byUser(userId || ''),
    queryFn: () => presenceApi.getUserPresence(userId!),
    enabled: enabled && !!userId,
    staleTime: 1000 * 10, // 10 секунд - короче для более актуальных данных
    refetchInterval,
    refetchOnWindowFocus: true,
  });

  const presence = query.data;

  return {
    presence,
    status: presence?.status ?? 'LONG_AGO' as PresenceStatus,
    isOnline: presence?.isOnline ?? false,
    lastSeen: presence?.lastSeen ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

/**
 * Hook to get presence data for multiple users
 */
export const useUsersPresence = (
  userIds: string[], 
  options: UsePresenceOptions = {}
) => {
  const { enabled = true, refetchInterval = 30000 } = options;

  const query = useQuery({
    queryKey: queryKeys.presence.batch(userIds),
    queryFn: () => presenceApi.getPresenceData(userIds),
    enabled: enabled && userIds.length > 0,
    staleTime: 1000 * 10,
    refetchInterval,
    refetchOnWindowFocus: true,
  });

  return {
    presenceData: query.data?.presenceData ?? {},
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export { useUserPresence as usePresence };
export default useUserPresence;