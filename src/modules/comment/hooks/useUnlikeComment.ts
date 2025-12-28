// src/modules/comment/hooks/useUnlikeComment.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentLikeApi } from '../api/commentLikeApi';
import type { CommentResponse, PageCommentResponse } from '../types/comment.types';

interface UseUnlikeCommentOptions {
  pinId?: string;
  parentId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Creates updated comment with unliked status
 */
const createUnlikedComment = (comment: CommentResponse): CommentResponse => ({
  ...comment,
  isLiked: false,
  likeCount: Math.max(0, comment.likeCount - 1),
});

/**
 * Updates comment in infinite pages
 */
const updateCommentInPages = (
  data: InfiniteData<PageCommentResponse> | undefined,
  commentId: string,
  updater: (comment: CommentResponse) => CommentResponse
): InfiniteData<PageCommentResponse> | undefined => {
  if (!data?.pages) return data;
  
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.map((comment) =>
        comment.id === commentId ? updater(comment) : comment
      ),
    })),
  };
};

/**
 * Hook to unlike a comment
 */
export const useUnlikeComment = (options: UseUnlikeCommentOptions = {}) => {
  const { pinId, parentId, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentLikeApi.unlike(commentId),
    
    onMutate: async (commentId) => {
      // Cancel all related queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });
      
      if (pinId) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.pins.comments(pinId),
        });
      }
      
      if (parentId) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.comments.replies(parentId),
        });
      }

      // Snapshot previous data
      const previousComment = queryClient.getQueryData<CommentResponse>(
        queryKeys.comments.byId(commentId)
      );

      const previousPinComments = pinId
        ? queryClient.getQueryData<InfiniteData<PageCommentResponse>>(
            [...queryKeys.pins.comments(pinId), 'infinite']
          )
        : undefined;

      const previousReplies = parentId
        ? queryClient.getQueryData<InfiniteData<PageCommentResponse>>(
            [...queryKeys.comments.replies(parentId), 'infinite']
          )
        : undefined;

      // Optimistic update for single comment
      if (previousComment) {
        queryClient.setQueryData<CommentResponse>(
          queryKeys.comments.byId(commentId),
          createUnlikedComment(previousComment)
        );
      }

      // Optimistic update for pin comments list
      if (pinId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          (oldData) => updateCommentInPages(oldData, commentId, createUnlikedComment)
        );
      }

      // Optimistic update for replies list
      if (parentId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.comments.replies(parentId), 'infinite'],
          (oldData) => updateCommentInPages(oldData, commentId, createUnlikedComment)
        );
      }

      return { previousComment, previousPinComments, previousReplies, commentId };
    },

    onSuccess: (_, commentId) => {
      // Invalidate likes list
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.likes(commentId),
      });

      onSuccess?.();
    },

    onError: (error: Error, commentId, context) => {
      // Rollback single comment
      if (context?.previousComment) {
        queryClient.setQueryData(
          queryKeys.comments.byId(commentId),
          context.previousComment
        );
      }
      
      // Rollback pin comments
      if (pinId && context?.previousPinComments) {
        queryClient.setQueryData(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          context.previousPinComments
        );
      }
      
      // Rollback replies
      if (parentId && context?.previousReplies) {
        queryClient.setQueryData(
          [...queryKeys.comments.replies(parentId), 'infinite'],
          context.previousReplies
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