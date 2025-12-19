// src/modules/pin/hooks/usePin.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';

interface UsePinOptions {
  enabled?: boolean;
}

/**
 * Hook to get a single pin by ID
 */
export const usePin = (
  pinId: string | null | undefined,
  options: UsePinOptions = {}
) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.pins.byId(pinId || ''),
    queryFn: () => pinApi.getById(pinId!),
    enabled: enabled && !!pinId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // ✅ Не рефетчить автоматически - мы обновляем кэш оптимистично
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    pin: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default usePin;