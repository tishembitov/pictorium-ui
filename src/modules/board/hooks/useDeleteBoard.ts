// src/modules/board/hooks/useDeleteBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { buildPath } from '@/app/router/routes';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import { useCurrentUsername } from '@/modules/auth';
import type { BoardResponse } from '../types/board.types';

interface UseDeleteBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  navigateOnSuccess?: boolean;
}

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
  const username = useCurrentUsername();

  const mutation = useMutation({
    mutationFn: (boardId: string) => boardApi.delete(boardId),

    onMutate: async (boardId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.my() });

      const previousMyBoards = queryClient.getQueryData<BoardResponse[]>(
        queryKeys.boards.my()
      );

      // ✅ Сохраняем название удаляемой доски для тоста
      const deletedBoard = previousMyBoards?.find((board) => board.id === boardId);
      const deletedBoardTitle = deletedBoard?.title;

      if (previousMyBoards) {
        queryClient.setQueryData<BoardResponse[]>(
          queryKeys.boards.my(),
          previousMyBoards.filter((board) => board.id !== boardId)
        );
      }

      if (selectedBoard?.id === boardId) {
        clearSelectedBoard();
      }

      return { 
        previousMyBoards, 
        wasSelected: selectedBoard?.id === boardId,
        deletedBoardTitle, // ✅ Передаём в контекст
      };
    },

    onSuccess: (_, boardId, context) => {
      queryClient.removeQueries({ queryKey: queryKeys.boards.byId(boardId) });
      queryClient.removeQueries({ queryKey: queryKeys.boards.pins(boardId) });
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.all,
        refetchType: 'none',
      });

      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      // ✅ Передаём название доски в тост
      toast.board.deleted(context?.deletedBoardTitle);

      if (navigateOnSuccess && username) {
        navigate(`${buildPath.profile(username)}#boards`);
      }

      onSuccess?.();
    },

    onError: (error: Error, boardId, context) => {
      if (context?.previousMyBoards) {
        queryClient.setQueryData(
          queryKeys.boards.my(),
          context.previousMyBoards
        );
      }

      if (context?.wasSelected && context.previousMyBoards) {
        const deletedBoard = context.previousMyBoards.find((b) => b.id === boardId);
        if (deletedBoard) {
          useSelectedBoardStore.getState().setSelectedBoard(deletedBoard);
        }
      }

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