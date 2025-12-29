// src/modules/board/hooks/useBoardPins.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import type { Pageable } from '@/shared/types/pageable.types';
import { PAGINATION } from '@/shared/utils/constants';

interface UseBoardPinsOptions {
  enabled?: boolean;
  pageable?: Pageable;
}

/**
 * Hook to get pins from a board
 */
export const useBoardPins = (
  boardId: string | null | undefined,
  options: UseBoardPinsOptions = {}
) => {
  const { enabled = true, pageable = {} } = options;

  const query = useQuery({
    queryKey: [...queryKeys.boards.pins(boardId || ''), pageable],
    queryFn: () => boardApi.getPins(boardId!, pageable),
    enabled: enabled && !!boardId,
    staleTime: 1000 * 30, // ✅ 30 секунд - быстрее устаревает для актуальности превью
  });

  return {
    data: query.data,
    pins: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching, // ✅ Добавлено
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for infinite scroll board pins
 */
export const useInfiniteBoardPins = (
  boardId: string | null | undefined,
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.boards.pins(boardId || ''), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      boardApi.getPins(boardId!, { page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!boardId,
    staleTime: 1000 * 60 * 2,
  });

  const pins = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    pins,
    totalElements,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useBoardPins;