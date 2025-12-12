// src/modules/storage/hooks/useConfirmUpload.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '../api/storageApi';
import { queryKeys } from '@/app/config/queryClient';
import type { ConfirmUploadRequest, ConfirmUploadResponse } from '../types/storage.types';

interface UseConfirmUploadOptions {
  onSuccess?: (data: ConfirmUploadResponse) => void;
  onError?: (error: Error) => void;
}

export const useConfirmUpload = (options: UseConfirmUploadOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: ConfirmUploadRequest) => 
      storageApi.confirmUpload(request),
    onSuccess: (data) => {
      // Invalidate images list
      queryClient.invalidateQueries({ queryKey: queryKeys.images.all });
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });

  return {
    confirmUpload: mutation.mutate,
    confirmUploadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useConfirmUpload;