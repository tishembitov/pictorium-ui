// src/modules/comment/hooks/useDeleteComment.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { CommentResponse, PageCommentResponse } from '../types/comment.types';
import type { PinResponse } from '@/modules/pin';

interface UseDeleteCommentOptions {
  pinId?: string;
  parentCommentId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Removes comment from pages and updates counts
 */
const removeCommentFromPages = (
  data: InfiniteData<PageCommentResponse> | undefined,
  commentId: string
): InfiniteData<PageCommentResponse> | undefined => {
  if (!data?.pages) return data;
  
  let removedCount = 0;
  
  return {
    ...data,
    pages: data.pages.map((page) => {
      const filtered = page.content.filter((c) => {
        if (c.id === commentId) {
          removedCount++;
          return false;
        }
        return true;
      });
      
      return {
        ...page,
        content: filtered,
        totalElements: page.totalElements - removedCount,
        numberOfElements: filtered.length,
      };
    }),
  };
};

/**
 * Hook to delete a comment
 */
export const useDeleteComment = (options: UseDeleteCommentOptions = {}) => {
  const { pinId, parentCommentId, onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),
    
    onMutate: async (commentId) => {
      // Cancel related queries
      if (pinId) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.pins.comments(pinId),
        });
        await queryClient.cancelQueries({
          queryKey: queryKeys.pins.byId(pinId),
        });
      }
      
      if (parentCommentId) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.comments.replies(parentCommentId),
        });
        await queryClient.cancelQueries({
          queryKey: queryKeys.comments.byId(parentCommentId),
        });
      }

      // Snapshot previous data
      const previousPinComments = pinId
        ? queryClient.getQueryData<InfiniteData<PageCommentResponse>>(
            [...queryKeys.pins.comments(pinId), 'infinite']
          )
        : undefined;

      const previousReplies = parentCommentId
        ? queryClient.getQueryData<InfiniteData<PageCommentResponse>>(
            [...queryKeys.comments.replies(parentCommentId), 'infinite']
          )
        : undefined;

      const previousPin = pinId
        ? queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId))
        : undefined;

      const previousParentComment = parentCommentId
        ? queryClient.getQueryData<CommentResponse>(
            queryKeys.comments.byId(parentCommentId)
          )
        : undefined;

      // Optimistic removal from pin comments
      if (pinId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          (oldData) => removeCommentFromPages(oldData, commentId)
        );

        // Update pin comment count
        if (previousPin) {
          queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), {
            ...previousPin,
            commentCount: Math.max(0, previousPin.commentCount - 1),
          });
        }
      }

      // Optimistic removal from replies
      if (parentCommentId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.comments.replies(parentCommentId), 'infinite'],
          (oldData) => removeCommentFromPages(oldData, commentId)
        );

        // Update parent reply count
        if (previousParentComment) {
          queryClient.setQueryData<CommentResponse>(
            queryKeys.comments.byId(parentCommentId),
            {
              ...previousParentComment,
              replyCount: Math.max(0, previousParentComment.replyCount - 1),
            }
          );
        }
      }

      return { 
        previousPinComments, 
        previousReplies, 
        previousPin, 
        previousParentComment,
        commentId,
      };
    },

    onSuccess: (_, commentId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.COMMENT_DELETED);
      }

      onSuccess?.();
    },

    onError: (error: Error, _, context) => {
      // Full rollback
      if (pinId && context?.previousPinComments) {
        queryClient.setQueryData(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          context.previousPinComments
        );
      }
      
      if (pinId && context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
      }
      
      if (parentCommentId && context?.previousReplies) {
        queryClient.setQueryData(
          [...queryKeys.comments.replies(parentCommentId), 'infinite'],
          context.previousReplies
        );
      }
      
      if (parentCommentId && context?.previousParentComment) {
        queryClient.setQueryData(
          queryKeys.comments.byId(parentCommentId),
          context.previousParentComment
        );
      }

      if (showToast) {
        toast.error(error.message || 'Failed to delete comment');
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