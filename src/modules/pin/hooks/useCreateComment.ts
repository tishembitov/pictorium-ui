// src/modules/pin/hooks/useCreateComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinCommentApi } from '../api/pinCommentApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { CommentResponse, CommentCreateRequest } from '@/modules/comment';
import type { PinResponse } from '../types/pin.types';

interface UseCreateCommentOptions {
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to create a comment on a pin
 */
export const useCreateComment = (
  pinId: string,
  options: UseCreateCommentOptions = {}
) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: CommentCreateRequest) =>
      pinCommentApi.createComment(pinId, data),
    onSuccess: (data) => {
      // Invalidate comments
      queryClient.invalidateQueries({
        queryKey: queryKeys.pins.comments(pinId),
      });
      
      // Update pin's comment count
      const pin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );
      if (pin) {
        queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), {
          ...pin,
          commentCount: pin.commentCount + 1,
        });
      }

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.COMMENT_CREATED);
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create comment');
      }

      onError?.(error);
    },
  });

  return {
    createComment: mutation.mutate,
    createCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};

export default useCreateComment;