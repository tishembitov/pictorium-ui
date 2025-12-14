// src/modules/comment/hooks/useUnlikeComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentLikeApi } from '../api/commentLikeApi';
import type { CommentResponse } from '../types/comment.types';

interface UseUnlikeCommentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to unlike a comment
 */
export const useUnlikeComment = (options: UseUnlikeCommentOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentLikeApi.unlike(commentId),
    onMutate: async (commentId) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });

      const previousComment = queryClient.getQueryData<CommentResponse>(
        queryKeys.comments.byId(commentId)
      );

      if (previousComment) {
        queryClient.setQueryData<CommentResponse>(
          queryKeys.comments.byId(commentId),
          {
            ...previousComment,
            isLiked: false,
            likeCount: Math.max(0, previousComment.likeCount - 1),
          }
        );
      }

      return { previousComment };
    },
    onSuccess: (_, commentId) => {
      // Invalidate likes list
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.likes(commentId),
      });

      onSuccess?.();
    },
    onError: (error: Error, commentId, context) => {
      // Rollback optimistic update
      if (context?.previousComment) {
        queryClient.setQueryData(
          queryKeys.comments.byId(commentId),
          context.previousComment
        );
      }

      onError?.(error);
    },
  });

  return {
    unlikeComment: mutation.mutate,
    unlikeCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnlikeComment;