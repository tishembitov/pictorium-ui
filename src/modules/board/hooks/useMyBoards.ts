// src/modules/board/hooks/useMyBoards.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useAuth } from '@/modules/auth';

interface UseMyBoardsOptions {
  enabled?: boolean;
}

/**
 * Hook to get current user's boards
 */
export const useMyBoards = (options: UseMyBoardsOptions = {}) => {
  const { enabled = true } = options;
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.boards.my(),
    queryFn: () => boardApi.getMyBoards(),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    boards: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isEmpty: (query.data?.length ?? 0) === 0,
  };
};

export default useMyBoards;