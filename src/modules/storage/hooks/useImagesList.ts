// src/modules/storage/hooks/useImagesList.ts

import { useQuery } from '@tanstack/react-query';
import { storageApi } from '../api/storageApi';
import { queryKeys } from '@/app/config/queryClient';
import type { ImageCategory } from '../types/storage.types';

interface UseImagesListOptions {
  category?: ImageCategory | string;
  enabled?: boolean;
}

/**
 * Hook to get list of images
 */
export const useImagesList = (options: UseImagesListOptions = {}) => {
  const { category, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.images.list(category),
    queryFn: () => storageApi.listImages(category),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useImagesList;