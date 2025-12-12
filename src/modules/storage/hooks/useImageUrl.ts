// src/modules/storage/hooks/useImageUrl.ts

import { useQuery } from '@tanstack/react-query';
import { storageApi } from '../api/storageApi';
import { queryKeys } from '@/app/config/queryClient';

interface UseImageUrlOptions {
  expiry?: number;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook to get presigned URL for an image
 */
export const useImageUrl = (
  imageId: string | null | undefined,
  options: UseImageUrlOptions = {}
) => {
  const { expiry, enabled = true, staleTime = 1000 * 60 * 5 } = options;

  return useQuery({
    queryKey: queryKeys.images.url(imageId || '', expiry),
    queryFn: () => storageApi.getImageUrl(imageId!, expiry),
    enabled: enabled && !!imageId,
    staleTime,
    gcTime: 1000 * 60 * 30,
  });
};

/**
 * Hook to get URLs for multiple images
 */
export const useImageUrls = (
  imageIds: (string | null | undefined)[],
  options: UseImageUrlOptions = {}
) => {
  const { expiry, enabled = true } = options;
  const validIds = imageIds.filter((id): id is string => !!id);

  return useQuery({
    queryKey: ['images', 'urls', validIds, expiry],
    queryFn: async () => {
      const promises = validIds.map(id => storageApi.getImageUrl(id, expiry));
      return Promise.all(promises);
    },
    enabled: enabled && validIds.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

/**
 * Build direct image URL (if your storage supports it)
 */
export const buildImageUrl = (imageId: string | null | undefined): string | null => {
  if (!imageId) return null;
  // This assumes your API gateway or storage service supports direct URLs
  // Adjust based on your actual setup
  return `/api/v1/images/${imageId}`;
};

export default useImageUrl;