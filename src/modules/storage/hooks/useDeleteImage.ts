// src/modules/storage/hooks/useDeleteImage.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '../api/storageApi';
import { queryKeys } from '@/app/config/queryClient';

interface UseDeleteImageOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to delete an image
 */
export const useDeleteImage = (options: UseDeleteImageOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (imageId: string) => storageApi.deleteImage(imageId),
    onSuccess: (_, imageId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.images.all });
      queryClient.removeQueries({ queryKey: queryKeys.images.metadata(imageId) });
      queryClient.removeQueries({ queryKey: queryKeys.images.url(imageId) });
      
      options.onSuccess?.();
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });

  return {
    deleteImage: mutation.mutate,
    deleteImageAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useDeleteImage;