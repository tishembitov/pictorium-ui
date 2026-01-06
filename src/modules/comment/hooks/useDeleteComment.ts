// src/modules/comment/hooks/useDeleteComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';

interface UseDeleteCommentOptions {
  pinId?: string;
  parentCommentId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Простая мутация для удаления комментария.
 */
export const useDeleteComment = (options: UseDeleteCommentOptions = {}) => {
  const { pinId, parentCommentId, onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),

    onSuccess: (_, commentId) => {
      // Удаляем из кэша
      queryClient.removeQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });

      // Фоновая инвалидация
      if (pinId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.pins.comments(pinId),
          refetchType: 'none',
        });
        
        void queryClient.invalidateQueries({
          queryKey: queryKeys.pins.byId(pinId),
          refetchType: 'none',
        });
      }

      if (parentCommentId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.comments.replies(parentCommentId),
          refetchType: 'none',
        });
        
        void queryClient.invalidateQueries({
          queryKey: queryKeys.comments.byId(parentCommentId),
          refetchType: 'none',
        });
      }

      if (showToast) {
        toast.comment.deleted();
      }

      onSuccess?.();
    },

    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to delete comment'); // Можно заменить на пресет
      }
      onError?.(error);
    },
  });

  return {
    deleteComment: mutation.mutate,
    deleteCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

export default useDeleteComment;