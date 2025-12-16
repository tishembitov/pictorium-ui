// ================================================
// FILE: src/pages/BoardDetailPage.tsx
// ================================================
import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Box, Flex, IconButton, Tooltip, Spinner, Heading, Text, Divider } from 'gestalt';
import { 
  BoardHeader, 
  useBoard,
  useSelectBoard,
  useSelectedBoard,
  useInfiniteBoardPins
} from '@/modules/board';
import { useIsOwner } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { ROUTES } from '@/app/router/routeConfig';
import { PinGrid } from '@/modules/pin';

const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const { board, isLoading, isError, error, refetch } = useBoard(boardId);
  const isOwner = useIsOwner(board?.userId);
  
  const { selectedBoard } = useSelectedBoard();
  const { selectBoard, deselectBoard } = useSelectBoard();

  const {
    pins,
    totalElements,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteBoardPins(boardId, { enabled: !!board });

  const handleSelectBoard = () => {
    if (boardId) {
      if (selectedBoard?.id === boardId) {
        deselectBoard();
      } else {
        selectBoard(boardId);
      }
    }
  };

  const handleFetchNextPage = () => {
    void fetchNextPage();
  };

  const handleRetry = () => {
    void refetch();
  };

  const handleNavigateToExplore = () => {
    navigate('/explore');
  };

  if (!boardId) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading board" show size="lg" />
      </Box>
    );
  }

  if (isError || !board) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="Board not found"
          message={error?.message || "This board doesn't exist"}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  const isSelected = selectedBoard?.id === boardId;

  return (
    <Box paddingY={4}>
      {/* Header */}
      <BoardHeader board={board} pinCount={totalElements} />

      {/* Quick Actions */}
      {isOwner && (
        <Box marginTop={4}>
          <Flex gap={2}>
            <Tooltip text={isSelected ? 'Deselect board' : 'Select for saving'}>
              <IconButton
                accessibilityLabel={isSelected ? 'Deselect board' : 'Select board'}
                icon={isSelected ? 'check' : 'add'}
                onClick={handleSelectBoard}
                size="lg"
                bgColor={isSelected ? 'red' : 'gray'}
                iconColor="white"
              />
            </Tooltip>
          </Flex>
        </Box>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <Box marginTop={3} padding={3} color="secondary" rounding={2}>
          <Text size="200">
            ✓ New pins will be saved to this board
          </Text>
        </Box>
      )}

      <Divider />

      {/* Pins */}
      <Box marginTop={4}>
        <Box marginBottom={4}>
          <Heading size="300" accessibilityLevel={2}>
            {totalElements} {totalElements === 1 ? 'Pin' : 'Pins'}
          </Heading>
        </Box>

        <PinGrid
          pins={pins}
          isLoading={isPinsLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={handleFetchNextPage}
          emptyMessage="This board is empty"
          emptyAction={
            isOwner
              ? { text: 'Add pins', onClick: handleNavigateToExplore }  
              : undefined
          }
        />
      </Box>
    </Box>
  );
};

export default BoardDetailPage;