// src/modules/pin/hooks/useCreateComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinCommentApi } from '../api/pinCommentApi';
import { useToast } from '@/shared/hooks/useToast';
import type { CommentResponse, CommentCreateRequest } from '@/modules/comment';

interface UseCreateCommentOptions {
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Простая мутация для создания комментария.
 * UI обновляется через refetch после успеха.
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
      // Инвалидируем для рефетча - комментарий появится после загрузки
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.comments(pinId),
      });
      
      // Обновляем счётчик комментариев в пине (optional)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.byId(pinId),
        refetchType: 'none',
      });

      toast.comment.added();
      onSuccess?.(data);
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment'); // Можно заменить на пресет, если потребуется
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