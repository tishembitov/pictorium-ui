// src/modules/chat/hooks/usePresence.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { presenceApi } from '../api/presenceApi';

interface UsePresenceOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to check if a single user is online
 */
export const useUserPresence = (userId: string | null | undefined, options: UsePresenceOptions = {}) => {
  const { enabled = true, refetchInterval = 30000 } = options;

  const query = useQuery({
    queryKey: queryKeys.presence.byUser(userId || ''),
    queryFn: () => presenceApi.isUserOnline(userId!),
    enabled: enabled && !!userId,
    staleTime: 1000 * 30,
    refetchInterval,
  });

  return {
    isOnline: query.data ?? false,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

/**
 * Hook to check online status for multiple users
 */
export const useUsersPresence = (userIds: string[], options: UsePresenceOptions = {}) => {
  const { enabled = true, refetchInterval = 30000 } = options;

  const query = useQuery({
    queryKey: queryKeys.presence.batch(userIds),
    queryFn: () => presenceApi.getOnlineStatus(userIds),
    enabled: enabled && userIds.length > 0,
    staleTime: 1000 * 30,
    refetchInterval,
  });

  return {
    onlineStatus: query.data?.onlineStatus ?? {},
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export { useUserPresence as usePresence };
export default useUserPresence;