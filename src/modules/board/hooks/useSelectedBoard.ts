// src/modules/board/hooks/useSelectedBoard.ts

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '@/app/config/queryClient';
import { selectedBoardApi } from '../api/selectedBoardApi';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import { useAuth } from '@/modules/auth';
import { isApiError } from '@/shared/api/apiClient';

interface UseSelectedBoardOptions {
  enabled?: boolean;
}

/**
 * Hook to get the currently selected board
 */
export const useSelectedBoard = (options: UseSelectedBoardOptions = {}) => {
  const { enabled = true } = options;
  const { isAuthenticated } = useAuth();
  const setSelectedBoard = useSelectedBoardStore((state) => state.setSelectedBoard);
  const storedBoard = useSelectedBoardStore((state) => state.selectedBoard);

  const query = useQuery({
    queryKey: queryKeys.boards.selected(),
    queryFn: () => selectedBoardApi.getSelected(),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    // Don't throw on 404 - it means no board is selected
    retry: (failureCount, error) => {
      if (isApiError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Check if error is 404
  const is404Error = isApiError(query.error) && query.error.response?.status === 404;

  // Sync with store
  useEffect(() => {
    if (query.data) {
      setSelectedBoard(query.data);
    }
  }, [query.data, setSelectedBoard]);

  return {
    selectedBoard: query.data ?? storedBoard,
    isLoading: query.isLoading,
    isError: query.isError && !is404Error,
    error: query.error,
    refetch: query.refetch,
    hasSelectedBoard: !!(query.data ?? storedBoard),
  };
};

export default useSelectedBoard;