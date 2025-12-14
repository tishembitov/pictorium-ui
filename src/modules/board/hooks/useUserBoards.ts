// src/modules/board/hooks/useUserBoards.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';

interface UseUserBoardsOptions {
  enabled?: boolean;
}

/**
 * Hook to get a user's boards
 */
export const useUserBoards = (
  userId: string | null | undefined,
  options: UseUserBoardsOptions = {}
) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.boards.byUser(userId || ''),
    queryFn: () => boardApi.getUserBoards(userId!),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2,
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

export default useUserBoards;