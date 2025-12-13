// src/modules/user/hooks/useUserByUsername.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { userApi } from '../api/userApi';

interface UseUserByUsernameOptions {
  enabled?: boolean;
}

/**
 * Hook to get user by username
 */
export const useUserByUsername = (
  username: string | null | undefined, 
  options: UseUserByUsernameOptions = {}
) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.users.byUsername(username || ''),
    queryFn: () => userApi.getByUsername(username!),
    enabled: enabled && !!username,
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

export default useUserByUsername;