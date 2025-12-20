// src/modules/board/components/BoardDetail.tsx

import React, { useState } from 'react';
import { Box, Spinner, Text, Tabs, Divider } from 'gestalt';
import { BoardHeader } from './BoardHeader';
import { BoardEditModal } from './BoardEditModal';
import { PinGrid } from '@/modules/pin';
import { useBoard } from '../hooks/useBoard';
import { useInfiniteBoardPins } from '../hooks/useBoardPins';
import { useIsOwner } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';

interface BoardDetailProps {
  boardId: string;
  onBack?: () => void;
}

type TabType = 'pins' | 'more';

export const BoardDetail: React.FC<BoardDetailProps> = ({ 
  boardId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pins');
  const [showEditModal, setShowEditModal] = useState(false);

  const { 
    board, 
    isLoading: isBoardLoading, 
    isError, 
    error,
    refetch,
  } = useBoard(boardId);

  const isOwner = useIsOwner(board?.userId);

  const {
    pins,
    totalElements,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteBoardPins(boardId, { enabled: !!board });

  const handleTabChange = ({ activeTabIndex }: { activeTabIndex: number }) => {
    setActiveTab(activeTabIndex === 0 ? 'pins' : 'more');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleRetry = () => {
    void refetch();
  };

  const handleFetchNextPage = () => {
    void fetchNextPage();
  };

  if (isBoardLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading board" show size="lg" />
      </Box>
    );
  }

  if (isError || !board) {
    return (
      <Box padding={8}>
        <ErrorMessage
          title="Board not found"
          message={error?.message || "This board doesn't exist or has been deleted"}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Board Header */}
      <BoardHeader 
        board={board} 
        pinCount={totalElements}
        onBack={onBack}
        onEdit={isOwner ? handleEdit : undefined}
      />

      {/* Tabs */}
      <Box marginTop={4}>
        <Tabs
          activeTabIndex={activeTab === 'pins' ? 0 : 1}
          onChange={handleTabChange}
          tabs={[
            { href: '#pins', text: 'Pins' },
            { href: '#more', text: 'More ideas' },
          ]}
          wrap
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {activeTab === 'pins' && (
          <PinGrid
            pins={pins}
            isLoading={isPinsLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={handleFetchNextPage}
            emptyMessage="No pins in this board yet"
          />
        )}

        {activeTab === 'more' && (
          <Box padding={8}>
            <Text align="center" color="subtle">
              Related pins coming soon...
            </Text>
          </Box>
        )}
      </Box>

      {/* Edit Modal */}
      {isOwner && (
        <BoardEditModal
          board={board}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </Box>
  );
};

export default BoardDetail;