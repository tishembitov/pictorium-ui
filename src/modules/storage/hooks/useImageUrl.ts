import { useQuery } from '@tanstack/react-query';
import { get } from '@/shared/api/apiClient';
import { IMAGE_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { queryKeys } from '@/app/config/queryClient';

interface ImageUrlResponse {
  imageId: string;
  url: string;
  expiresAt: number;
}

interface UseImageUrlOptions {
  expiry?: number; // seconds
  enabled?: boolean;
}

/**
 * Hook для получения presigned URL изображения
 */
export const useImageUrl = (
  imageId: string | null | undefined,
  options: UseImageUrlOptions = {}
) => {
  const { expiry, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.images.url(imageId || '', expiry),
    queryFn: async () => {
      if (!imageId) {
        throw new Error('Image ID is required');
      }
      
      const params = expiry ? { expiry } : undefined;
      return get<ImageUrlResponse>(IMAGE_ENDPOINTS.url(imageId), { params });
    },
    enabled: enabled && !!imageId,
    staleTime: 1000 * 60 * 5, // 5 minutes (URL valid longer)
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook для получения URL нескольких изображений
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
      const promises = validIds.map(id => 
        get<ImageUrlResponse>(IMAGE_ENDPOINTS.url(id), { 
          params: expiry ? { expiry } : undefined 
        })
      );
      return Promise.all(promises);
    },
    enabled: enabled && validIds.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export default useImageUrl;