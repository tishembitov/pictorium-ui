// src/modules/board/hooks/useMyBoardsForPin.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useAuth } from '@/modules/auth';

interface UseMyBoardsForPinOptions {
  enabled?: boolean;
}

/**
 * Hook to get current user's boards with pin save status
 * Используется в PinSaveButton для отображения в каких досках уже есть пин
 */
export const useMyBoardsForPin = (
  pinId: string | null | undefined,
  options: UseMyBoardsForPinOptions = {}
) => {
  const { enabled = true } = options;
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.boards.forPin(pinId || ''),
    queryFn: () => boardApi.getMyBoardsForPin(pinId!),
    enabled: enabled && isAuthenticated && !!pinId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Вычисляем полезные производные данные
  const boardsWithPin = query.data?.filter(b => b.hasPin) ?? [];
  const boardsWithoutPin = query.data?.filter(b => !b.hasPin) ?? [];

  return {
    boards: query.data ?? [],
    boardsWithPin,
    boardsWithoutPin,
    savedCount: boardsWithPin.length,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useMyBoardsForPin;