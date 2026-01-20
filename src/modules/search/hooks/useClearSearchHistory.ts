// src/modules/search/hooks/useClearSearchHistory.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';
import { useToast } from '@/shared/hooks/useToast';

export const useClearSearchHistory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => searchApi.clearHistory(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.search.history(), []);
      toast.success('Search history cleared');
    },
    onError: () => {
      toast.error('Failed to clear search history');
    },
  });
};

export default useClearSearchHistory;