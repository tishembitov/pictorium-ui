// src/modules/board/hooks/useBoard.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';

interface UseBoardOptions {
  enabled?: boolean;
}

/**
 * Hook to get a board by ID
 */
export const useBoard = (
  boardId: string | null | undefined,
  options: UseBoardOptions = {}
) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.boards.byId(boardId || ''),
    queryFn: () => boardApi.getById(boardId!),
    enabled: enabled && !!boardId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    board: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useBoard;