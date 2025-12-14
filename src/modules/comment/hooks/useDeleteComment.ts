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
 * Hook to delete a comment
 */
export const useDeleteComment = (options: UseDeleteCommentOptions = {}) => {
  const { pinId, parentCommentId, onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),
    onSuccess: (_, commentId) => {
      // Invalidate comment
      queryClient.removeQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });
      
      // Invalidate pin comments
      if (pinId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.pins.comments(pinId),
        });
      }
      
      // Invalidate parent comment replies
      if (parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments.replies(parentCommentId),
        });
        // Update parent replyCount
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments.byId(parentCommentId),
        });
      }

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.COMMENT_DELETED);
      }

      onSuccess?.();
    },
    onError: (error: Error) => {
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