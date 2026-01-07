// src/modules/pin/hooks/useCreateComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinCommentApi } from '../api/pinCommentApi';
import { useToast } from '@/shared/hooks/useToast';
import type { CommentResponse, CommentCreateRequest } from '@/modules/comment';
import type { PinResponse } from '../types/pin.types';

interface UseCreateCommentOptions {
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Мутация для создания комментария.
 * ✅ Обновляет commentCount в кэше пина для синхронизации состояния.
 */
export const useCreateComment = (
  pinId: string,
  options: UseCreateCommentOptions = {}
) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: CommentCreateRequest) =>
      pinCommentApi.createComment(pinId, data),

    onSuccess: (data) => {
      // ✅ КЛЮЧЕВОЕ: Обновляем commentCount в кэше пина
      queryClient.setQueryData<PinResponse | undefined>(
        queryKeys.pins.byId(pinId),
        (oldPin) => {
          if (!oldPin) return oldPin;
          return {
            ...oldPin,
            commentCount: oldPin.commentCount + 1,
          };
        }
      );

      // Инвалидируем список комментариев для рефетча
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.comments(pinId),
      });

      // Инвалидируем списки пинов (для обновления commentCount в гридах)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      toast.comment.added();
      onSuccess?.(data);
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
      onError?.(error);
    },
  });

  return {
    createComment: mutation.mutate,
    createCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export default useCreateComment;