// src/modules/user/hooks/useUser.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { userApi } from '../api/userApi';

interface UseUserOptions {
  enabled?: boolean;
}

/**
 * Hook to get user by ID
 */
export const useUser = (userId: string | null | undefined, options: UseUserOptions = {}) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.users.byId(userId || ''),
    queryFn: () => userApi.getById(userId!),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useUser;