// src/modules/board/hooks/useDeleteBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { ROUTES } from '@/app/router/routeConfig';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';

interface UseDeleteBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  navigateOnSuccess?: boolean;
}

/**
 * Простая мутация для удаления доски.
 */
export const useDeleteBoard = (options: UseDeleteBoardOptions = {}) => {
  const {
    onSuccess,
    onError,
    navigateOnSuccess = true,
  } = options;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const clearSelectedBoard = useSelectedBoardStore((state) => state.clearSelectedBoard);

  const mutation = useMutation({
    mutationFn: (boardId: string) => boardApi.delete(boardId),

    onSuccess: (_, boardId) => {
      // Удаляем из кэша
      queryClient.removeQueries({ queryKey: queryKeys.boards.byId(boardId) });
      
      // Инвалидируем списки
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.all,
        refetchType: 'none',
      });

      // Очищаем selected board если это она
      if (selectedBoard?.id === boardId) {
        clearSelectedBoard();
      }

      toast.success('Board deleted');

      if (navigateOnSuccess) {
        navigate(ROUTES.HOME);
      }

      onSuccess?.();
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete board');
      onError?.(error);
    },
  });

  return {
    deleteBoard: mutation.mutate,
    deleteBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useDeleteBoard;