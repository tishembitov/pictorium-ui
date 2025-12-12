// src/modules/storage/hooks/useImageMetadata.ts

import { useQuery } from '@tanstack/react-query';
import { storageApi } from '../api/storageApi';
import { queryKeys } from '@/app/config/queryClient';

interface UseImageMetadataOptions {
  enabled?: boolean;
}

/**
 * Hook to get image metadata
 */
export const useImageMetadata = (
  imageId: string | null | undefined,
  options: UseImageMetadataOptions = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.images.metadata(imageId || ''),
    queryFn: () => storageApi.getImageMetadata(imageId!),
    enabled: enabled && !!imageId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};

export default useImageMetadata;