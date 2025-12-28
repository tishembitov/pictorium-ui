// ================================================
// FILE: src/modules/pin/components/PinGrid.tsx
// ================================================

import React, { useCallback, useRef } from 'react';
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

// === Константы Masonry ===
const COLUMN_WIDTH = 236;
const GUTTER_WIDTH = 8; // Минимальные отступы
const MIN_COLUMNS = 2;

// Masonry item component
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
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Memoize scroll container getter
  const getScrollContainer = useCallback(() => {
    scrollContainerRef.current ??= document.documentElement;
    return scrollContainerRef.current;
  }, []);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Initial loading
  if (isLoading && pins.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={6}>
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
      <Masonry
        items={pins}
        renderItem={GridItem}
        columnWidth={COLUMN_WIDTH}
        gutterWidth={GUTTER_WIDTH}
        minCols={MIN_COLUMNS}
        loadItems={handleLoadMore}
        scrollContainer={getScrollContainer}
        virtualize={false}
        // === Layout вычисляется мгновенно благодаря известным размерам ===
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