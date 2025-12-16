// src/modules/board/hooks/useDeleteBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { ROUTES } from '@/app/router/routeConfig';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';

interface UseDeleteBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  navigateOnSuccess?: boolean;
}

/**
 * Hook to delete a board
 */
export const useDeleteBoard = (options: UseDeleteBoardOptions = {}) => {
  const {
    onSuccess,
    onError,
    showToast = true,
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
      // Remove board from cache
      queryClient.removeQueries({ queryKey: queryKeys.boards.byId(boardId) });
      // Invalidate boards lists
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });

      // Clear selected board if it was deleted
      if (selectedBoard?.id === boardId) {
        clearSelectedBoard();
      }

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.BOARD_DELETED);
      }

      if (navigateOnSuccess) {
        navigate(ROUTES.HOME);
      }

      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to delete board');
      }

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