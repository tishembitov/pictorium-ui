// src/modules/board/hooks/useDeleteBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { buildPath } from '@/app/router/routeConfig';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import { useAuthStore } from '@/modules/auth';
import type { BoardResponse } from '../types/board.types';

interface UseDeleteBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  navigateOnSuccess?: boolean;
}

/**
 * Мутация для удаления доски.
 * 
 * Паттерн: Optimistic Update + инвалидация
 * - Мгновенно удаляем доску из кэша списков
 * - Очищаем selectedBoard если это она
 * - Инвалидируем связанные запросы для фоновой синхронизации
 * - Редирект на страницу профиля пользователя (секция досок)
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
  const currentUser = useAuthStore((state) => state.user);

  const mutation = useMutation({
    mutationFn: (boardId: string) => boardApi.delete(boardId),

    onMutate: async (boardId: string) => {
      // 1. Отменяем исходящие запросы чтобы не перезаписали optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.my() });

      // 2. Сохраняем предыдущее состояние для отката
      const previousMyBoards = queryClient.getQueryData<BoardResponse[]>(
        queryKeys.boards.my()
      );

      // 3. Optimistic Update — удаляем доску из списка
      if (previousMyBoards) {
        queryClient.setQueryData<BoardResponse[]>(
          queryKeys.boards.my(),
          previousMyBoards.filter((board) => board.id !== boardId)
        );
      }

      // 4. Очищаем selectedBoard если это удаляемая доска
      if (selectedBoard?.id === boardId) {
        clearSelectedBoard();
      }

      // 5. Возвращаем контекст для отката
      return { previousMyBoards, wasSelected: selectedBoard?.id === boardId };
    },

    onSuccess: (_, boardId) => {
      // Удаляем конкретную доску из кэша
      queryClient.removeQueries({ queryKey: queryKeys.boards.byId(boardId) });
      
      // Инвалидируем связанные запросы (обновятся при следующем использовании)
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.all,
        refetchType: 'none',
      });

      toast.success('Board deleted');

      if (navigateOnSuccess && currentUser?.username) {
        // Редирект на профиль пользователя с hash для секции досок
        navigate(`${buildPath.profile(currentUser.username)}#boards`);
      }

      onSuccess?.();
    },

    onError: (error: Error, boardId, context) => {
      // Откатываем optimistic update
      if (context?.previousMyBoards) {
        queryClient.setQueryData(
          queryKeys.boards.my(),
          context.previousMyBoards
        );
      }

      // Восстанавливаем selectedBoard если была выбрана удаляемая доска
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