// src/modules/pin/hooks/useCreateComment.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinCommentApi } from '../api/pinCommentApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { generateId } from '@/shared/utils/helpers';
import type { CommentResponse, CommentCreateRequest, PageCommentResponse } from '@/modules/comment';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseCreateCommentOptions {
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Updates pin's commentCount in pages
 */
const updatePinCommentCount = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string,
  delta: number
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.map((pin) =>
        pin.id === pinId
          ? { ...pin, commentCount: Math.max(0, pin.commentCount + delta) }
          : pin
      ),
    })),
  };
};

/**
 * Creates empty page structure for comments
 */
const createEmptyCommentPage = (comment: CommentResponse): InfiniteData<PageCommentResponse> => ({
  pages: [{
    content: [comment],
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    last: true,
    numberOfElements: 1,
    pageable: {
      offset: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      pageNumber: 0,
      pageSize: 20,
      paged: true,
      unpaged: false,
    },
    empty: false,
  }],
  pageParams: [0],
});

/**
 * Adds optimistic comment to the beginning of first page
 */
const addOptimisticComment = (
  data: InfiniteData<PageCommentResponse> | undefined,
  comment: CommentResponse
): InfiniteData<PageCommentResponse> | undefined => {
  if (!data?.pages || data.pages.length === 0) {
    return createEmptyCommentPage(comment);
  }

  const firstPage = data.pages[0];
  if (!firstPage) return data;

  return {
    ...data,
    pages: [
      {
        ...firstPage,
        content: [comment, ...firstPage.content],
        totalElements: firstPage.totalElements + 1,
        numberOfElements: firstPage.numberOfElements + 1,
      },
      ...data.pages.slice(1),
    ],
  };
};

/**
 * Replaces optimistic comment with real one in page content
 */
const replaceCommentInContent = (
  content: CommentResponse[],
  optimisticId: string,
  realComment: CommentResponse
): CommentResponse[] => {
  return content.map((comment) =>
    comment.id === optimisticId ? realComment : comment
  );
};

/**
 * Replaces optimistic comment with real comment in pages
 */
const replaceOptimisticComment = (
  data: InfiniteData<PageCommentResponse> | undefined,
  optimisticId: string,
  realComment: CommentResponse
): InfiniteData<PageCommentResponse> | undefined => {
  if (!data?.pages) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: replaceCommentInContent(page.content, optimisticId, realComment),
    })),
  };
};

/**
 * Creates optimistic comment object
 */
const createOptimisticComment = (
  pinId: string,
  userId: string,
  data: CommentCreateRequest
): CommentResponse => ({
  id: `optimistic-${generateId()}`,
  pinId,
  userId,
  parentCommentId: null,
  content: data.content || null,
  imageId: data.imageId || null,
  isLiked: false,
  likeCount: 0,
  replyCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

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
  const currentUser = useAuthStore((state) => state.user);

  const mutation = useMutation({
    mutationFn: (data: CommentCreateRequest) =>
      pinCommentApi.createComment(pinId, data),

    onMutate: async (data) => {
      // Cancel related queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.pins.comments(pinId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.pins.byId(pinId),
      });

      // Snapshot previous data
      const previousComments = queryClient.getQueryData<InfiniteData<PageCommentResponse>>(
        [...queryKeys.pins.comments(pinId), 'infinite']
      );

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Create optimistic comment
      const optimisticComment = createOptimisticComment(
        pinId,
        currentUser?.id || '',
        data
      );

      // Optimistic: add comment to list
      queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
        [...queryKeys.pins.comments(pinId), 'infinite'],
        (oldData) => addOptimisticComment(oldData, optimisticComment)
      );

      // Optimistic: update pin's comment count
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), {
          ...previousPin,
          commentCount: previousPin.commentCount + 1,
        });
      }

      // Update pin's comment count in all pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinCommentCount(oldData, pinId, 1)
      );

      return { previousComments, previousPin, optimisticId: optimisticComment.id };
    },

    onSuccess: (data, _, context) => {
      // Replace optimistic comment with real one
      if (context?.optimisticId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          (oldData) => replaceOptimisticComment(oldData, context.optimisticId, data)
        );
      }

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.COMMENT_CREATED);
      }

      onSuccess?.(data);
    },

    onError: (error: Error, _, context) => {
      // Rollback comments
      if (context?.previousComments) {
        queryClient.setQueryData(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          context.previousComments
        );
      }

      // Rollback pin
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
      }

      // Rollback pin lists
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });

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