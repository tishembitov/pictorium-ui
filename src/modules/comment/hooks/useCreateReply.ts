// src/modules/comment/hooks/useCreateReply.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { CommentCreateRequest, CommentResponse } from '../types/comment.types';

interface UseCreateReplyOptions {
  pinId?: string;
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Простая мутация для создания ответа на комментарий.
 */
export const useCreateReply = (
  commentId: string,
  options: UseCreateReplyOptions = {}
) => {
  const { pinId, onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: CommentCreateRequest) =>
      commentApi.createReply(commentId, data),
      
    onSuccess: (data) => {
      // Фоновая инвалидация
      void queryClient.invalidateQueries({
        queryKey: queryKeys.comments.replies(commentId),
        refetchType: 'none',
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byId(commentId),
        refetchType: 'none',
      });

      if (pinId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.pins.comments(pinId),
          refetchType: 'none',
        });
      }

      if (showToast) {
        toast.comment.replied();
      }

      onSuccess?.(data);
    },
    
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create reply'); // Можно заменить на пресет
      }
      onError?.(error);
    },
  });

  return {
    createReply: mutation.mutate,
    createReplyAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};

export default useCreateReply;