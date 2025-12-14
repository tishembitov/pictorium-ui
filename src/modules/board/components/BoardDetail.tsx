// src/modules/board/components/BoardDetail.tsx

import React from 'react';
import { Box, Spinner, Text } from 'gestalt';
import { BoardHeader } from './BoardHeader';
import { PinGrid } from '@/modules/pin';
import { useBoard } from '../hooks/useBoard';
import { useInfiniteBoardPins } from '../hooks/useBoardPins';

interface BoardDetailProps {
  boardId: string;
}

export const BoardDetail: React.FC<BoardDetailProps> = ({ boardId }) => {
  const { board, isLoading: isBoardLoading, isError, error } = useBoard(boardId);
  const {
    pins,
    totalElements,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteBoardPins(boardId, { enabled: !!board });

  if (isBoardLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading board" show />
      </Box>
    );
  }

  if (isError || !board) {
    return (
      <Box padding={8}>
        <Text color="error" align="center">
          {error?.message || 'Failed to load board'}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <BoardHeader board={board} pinCount={totalElements} />

      <Box marginTop={4}>
        <PinGrid
          pins={pins}
          isLoading={isPinsLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          emptyMessage="This board is empty"
        />
      </Box>
    </Box>
  );
};

export default BoardDetail;