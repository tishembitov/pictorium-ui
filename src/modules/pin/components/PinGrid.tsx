// src/modules/pin/components/PinGrid.tsx

import React, { useCallback } from 'react';
import { Box, Masonry, Spinner } from 'gestalt';
import { EmptyState } from '@/shared/components';
import { PinCard } from './PinCard';
import type { PinResponse } from '../types/pin.types';

interface PinGridProps {
  pins: PinResponse[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  emptyMessage?: string;
  emptyAction?: {
    text: string;
    onClick: () => void;
  };
}

const COLUMN_WIDTH = 236;
const GUTTER_WIDTH = 16;
const MIN_COLUMNS = 2;

const GridItem = ({ data }: { data: PinResponse }) => {
  return <PinCard pin={data} />;
};

export const PinGrid: React.FC<PinGridProps> = ({
  pins,
  isLoading,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  emptyMessage = 'No pins found',
  emptyAction,
}) => {
  const getScrollContainer = useCallback((): HTMLElement | Window => {
    return window;
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (isLoading && pins.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading pins" show />
      </Box>
    );
  }

  if (!isLoading && pins.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        icon="pin"
        action={emptyAction}
      />
    );
  }

  return (
    <Box width="100%">
      <Masonry
        items={pins}
        renderItem={GridItem}
        columnWidth={COLUMN_WIDTH}
        gutterWidth={GUTTER_WIDTH}
        minCols={MIN_COLUMNS}
        loadItems={handleLoadMore}
        scrollContainer={getScrollContainer}
        virtualize
      />
      
      {isFetchingNextPage && (
        <Box display="flex" justifyContent="center" padding={4}>
          <Spinner accessibilityLabel="Loading more pins" show />
        </Box>
      )}
    </Box>
  );
};

export default PinGrid;