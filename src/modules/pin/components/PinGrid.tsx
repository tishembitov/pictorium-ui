// src/modules/pin/components/PinGrid.tsx

import React, { useCallback, useRef } from 'react';
import { Box, Spinner} from 'gestalt';
import { MasonryGrid, EmptyState } from '@/shared/components';
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
  columnWidth?: number;
  gutterWidth?: number;
}

// Masonry item component
const PinGridItem: React.FC<{ data: PinResponse }> = ({ data }) => {
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
  columnWidth = 236,
  gutterWidth = 14,
}) => {
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const getScrollContainer = useCallback(() => {
    scrollContainerRef.current ??= document.documentElement;
    return scrollContainerRef.current;
  }, []);

  // Loading state
  if (isLoading && pins.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Loading pins" show />
      </Box>
    );
  }

  // Empty state
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
      <MasonryGrid
        items={pins}
        renderItem={PinGridItem}
        columnWidth={columnWidth}
        gutterWidth={gutterWidth}
        minCols={2}
        loadMore={fetchNextPage}
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        scrollContainer={getScrollContainer}
      />
    </Box>
  );
};

export default PinGrid;