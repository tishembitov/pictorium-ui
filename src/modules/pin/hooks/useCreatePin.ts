// src/modules/pin/hooks/useCreatePin.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { buildPath } from '@/app/router/routeConfig';
import type { PinCreateRequest, PinResponse, PagePinResponse } from '../types/pin.types';

interface UseCreatePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  navigateToPin?: boolean;
}

/**
 * Добавляет пин в начало первой страницы
 */
const addPinToPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pin: PinResponse
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages || data.pages.length === 0) {
    // Создаем новую структуру если нет данных
    return {
      pages: [{
        content: [pin],
        totalElements: 1,
        totalPages: 1,
        size: 25,
        number: 0,
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        last: true,
        numberOfElements: 1,
        pageable: {
          offset: 0,
          sort: { empty: true, sorted: false, unsorted: true },
          pageNumber: 0,
          pageSize: 25,
          paged: true,
          unpaged: false,
        },
        empty: false,
      }],
      pageParams: [0],
    };
  }

  const firstPage = data.pages[0];
  if (!firstPage) return data;

  return {
    ...data,
    pages: [
      {
        ...firstPage,
        content: [pin, ...firstPage.content],
        totalElements: firstPage.totalElements + 1,
        numberOfElements: firstPage.numberOfElements + 1,
      },
      ...data.pages.slice(1),
    ],
  };
};

/**
 * Hook to create a new pin
 */
export const useCreatePin = (options: UseCreatePinOptions = {}) => {
  const { 
    onSuccess, 
    onError, 
    showToast = true,
    navigateToPin = true,
  } = options;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: PinCreateRequest) => pinApi.create(data),
    
    onSuccess: (data) => {
      // ✅ Добавляем пин в кеш отдельного пина
      queryClient.setQueryData(queryKeys.pins.byId(data.id), data);
      
      // ✅ Добавляем пин во ВСЕ списки пинов (главная страница, профиль и т.д.)
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => addPinToPages(oldData, data)
      );
      
      // ✅ Также инвалидируем для синхронизации с сервером (в фоне)
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.all,
        refetchType: 'none', // Не рефетчим сразу, данные уже добавлены
      });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PIN_CREATED);
      }
      
      if (navigateToPin) {
        navigate(buildPath.pin(data.id));
      }
      
      onSuccess?.(data);
    },
    
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create pin');
      }
      
      onError?.(error);
    },
  });

  return {
    createPin: mutation.mutate,
    createPinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useCreatePin;