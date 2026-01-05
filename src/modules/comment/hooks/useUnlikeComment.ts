// src/modules/comment/hooks/useUnlikeComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentLikeApi } from '../api/commentLikeApi';

interface UseUnlikeCommentOptions {
  pinId?: string;
  parentId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Простая мутация для анлайка комментария.
 */
export const useUnlikeComment = (options: UseUnlikeCommentOptions = {}) => {
  const { pinId, parentId, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentLikeApi.unlike(commentId),

    onSuccess: (_, commentId) => {
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

      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    unlikeComment: mutation.mutate,
    unlikeCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useUnlikeComment;