// src/modules/search/components/SearchPinGrid.tsx

import React, { useCallback } from 'react';
import { Box, Masonry, Spinner } from 'gestalt';
import { EmptyState } from '@/shared/components';
import { SearchPinCard } from './SearchPinCard';
import type { PinSearchResult } from '../types/search.types';

interface SearchPinGridProps {
  pins: PinSearchResult[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  emptyMessage?: string;
  showHighlights?: boolean;
}

const COLUMN_WIDTH = 236;
const GUTTER_WIDTH = 16;
const MIN_COLUMNS = 2;

interface GridItemProps {
  pin: PinSearchResult;
  showHighlights: boolean;
}

const GridItem: React.FC<GridItemProps> = ({ pin, showHighlights }) => {
  return <SearchPinCard pin={pin} showHighlights={showHighlights} />;
};

export const SearchPinGrid: React.FC<SearchPinGridProps> = ({
  pins,
  isLoading,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  emptyMessage = 'No pins found',
  showHighlights = true,
}) => {
  const getScrollContainer = useCallback((): HTMLElement | Window => globalThis.window, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Fixed: access props.data instead of destructuring to avoid unused variable warning
  const renderItem = useCallback(
    (props: { data: PinSearchResult }) => (
      <GridItem pin={props.data} showHighlights={showHighlights} />
    ),
    [showHighlights]
  );

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
      />
    );
  }

  return (
    <Box width="100%">
      <Masonry
        items={pins}
        renderItem={renderItem}
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

export default SearchPinGrid;