// src/modules/board/hooks/useSavePinToBoards.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { BatchBoardPinAction } from '../types/board.types';

interface UseSavePinToBoardsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Check if query is for user's saved pins
 */
const isSavedPinsQuery = (queryKey: unknown[], userId: string): boolean => {
  if (queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedAnywhere === userId || 
         filter?.savedBy === userId || 
         filter?.savedToProfileBy === userId;
};

/**
 * Hook to save a pin to multiple boards at once
 */
export const useSavePinToBoards = (options: UseSavePinToBoardsOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ pinId, boardIds }: BatchBoardPinAction) =>
      boardApi.savePinToBoards(pinId, boardIds),
    
    onSuccess: (_, { pinId, boardIds }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });
      
      // Invalidate each affected board's pins
      boardIds.forEach(boardId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      });

      // Invalidate user's saved pins queries
      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            if (!Array.isArray(key)) return false;
            return isSavedPinsQuery(key, userId);
          },
        });
      }

      if (showToast) {
        const count = boardIds.length;
        toast.success(`Pin saved to ${count} ${count === 1 ? 'board' : 'boards'}!`);
      }

      onSuccess?.();
    },

    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }
      onError?.(error);
    },
  });

  return {
    savePinToBoards: mutation.mutate,
    savePinToBoardsAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSavePinToBoards;