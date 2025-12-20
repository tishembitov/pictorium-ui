// src/modules/board/hooks/useSelectedBoard.ts

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '@/app/config/queryClient';
import { selectedBoardApi } from '../api/selectedBoardApi';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import { useAuth } from '@/modules/auth';
import { isApiError } from '@/shared/api/apiClient';
import type { BoardResponse } from '../types/board.types';

interface UseSelectedBoardOptions {
  enabled?: boolean;
}

export const useSelectedBoard = (options: UseSelectedBoardOptions = {}) => {
  const { enabled = true } = options;
  const { isAuthenticated } = useAuth();
  const setSelectedBoard = useSelectedBoardStore((state) => state.setSelectedBoard);
  const clearSelectedBoard = useSelectedBoardStore((state) => state.clearSelectedBoard);
  const storedBoard = useSelectedBoardStore((state) => state.selectedBoard);

  const query = useQuery({
    queryKey: queryKeys.boards.selected(),
    queryFn: async (): Promise<BoardResponse | null> => {
      try {
        return await selectedBoardApi.getSelected();
      } catch (error) {
        // 404 означает что доска не выбрана - это нормальное состояние
        if (isApiError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    // Не ретраить 404 ошибки
    retry: (failureCount, error) => {
      if (isApiError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    // ✅ Не показывать ошибку для 404
    throwOnError: false,
  });

  // Sync with store
  useEffect(() => {
    if (query.isSuccess) {
      if (query.data) {
        setSelectedBoard(query.data);
      } else {
        clearSelectedBoard();
      }
    }
  }, [query.isSuccess, query.data, setSelectedBoard, clearSelectedBoard]);

  // ✅ Не считаем 404 за ошибку
  const is404Error = isApiError(query.error) && query.error.response?.status === 404;

  return {
    selectedBoard: query.data ?? storedBoard,
    isLoading: query.isLoading,
    isError: query.isError && !is404Error,
    error: is404Error ? null : query.error,
    refetch: query.refetch,
    hasSelectedBoard: !!(query.data ?? storedBoard),
  };
};

export default useSelectedBoard;