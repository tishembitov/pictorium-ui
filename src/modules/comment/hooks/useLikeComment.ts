// src/modules/comment/hooks/useLikeComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentLikeApi } from '../api/commentLikeApi';
import type { CommentResponse } from '../types/comment.types';

interface UseLikeCommentOptions {
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to like a comment
 */
export const useLikeComment = (options: UseLikeCommentOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentLikeApi.like(commentId),
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
            isLiked: true,
            likeCount: previousComment.likeCount + 1,
          }
        );
      }

      return { previousComment };
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(queryKeys.comments.byId(data.id), data);
      
      // Invalidate likes list
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.likes(data.id),
      });

      onSuccess?.(data);
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
    likeComment: mutation.mutate,
    likeCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useLikeComment;