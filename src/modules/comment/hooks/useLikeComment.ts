// src/modules/comment/hooks/useLikeComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentLikeApi } from '../api/commentLikeApi';
import type { CommentResponse } from '../types/comment.types';

interface UseLikeCommentOptions {
  pinId?: string;
  parentId?: string;
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Простая мутация для лайка комментария.
 * UI обновляется через onToggle callback в компоненте.
 */
export const useLikeComment = (options: UseLikeCommentOptions = {}) => {
  const { pinId, parentId, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentLikeApi.like(commentId),

    onSuccess: (data, commentId) => {
      // Фоновая инвалидация
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.comments.byId(commentId),
        refetchType: 'none',
      });
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.comments.likes(commentId),
        refetchType: 'none',
      });

      if (pinId) {
        void queryClient.invalidateQueries({ 
          queryKey: queryKeys.pins.comments(pinId),
          refetchType: 'none',
        });
      }

      if (parentId) {
        void queryClient.invalidateQueries({ 
          queryKey: queryKeys.comments.replies(parentId),
          refetchType: 'none',
        });
      }

      onSuccess?.(data);
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    likeComment: mutation.mutate,
    likeCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useLikeComment;