// src/modules/storage/hooks/usePresignedUpload.ts

import { useMutation } from '@tanstack/react-query';
import { storageApi } from '../api/storageApi';
import type { PresignedUploadRequest, PresignedUploadResponse } from '../types/storage.types';

interface UsePresignedUploadOptions {
  onSuccess?: (data: PresignedUploadResponse) => void;
  onError?: (error: Error) => void;
}

export const usePresignedUpload = (options: UsePresignedUploadOptions = {}) => {

  const mutation = useMutation({
    mutationFn: (request: PresignedUploadRequest) => 
      storageApi.getPresignedUploadUrl(request),
    onSuccess: (data) => {
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });

  return {
    getPresignedUrl: mutation.mutate,
    getPresignedUrlAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default usePresignedUpload;