// src/modules/comment/hooks/useCreateReply.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { CommentCreateRequest, CommentResponse } from '../types/comment.types';

interface UseCreateReplyOptions {
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to create a reply to a comment
 */
export const useCreateReply = (
  commentId: string,
  options: UseCreateReplyOptions = {}
) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: CommentCreateRequest) =>
      commentApi.createReply(commentId, data),
    onSuccess: (data) => {
      // Invalidate replies
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.replies(commentId),
      });
      // Invalidate parent comment to update replyCount
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.COMMENT_CREATED);
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create reply');
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