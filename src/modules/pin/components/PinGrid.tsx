// src/modules/pin/components/PinGrid.tsx

import React, { useCallback } from 'react';
import { Box, Masonry, Spinner } from 'gestalt';
import { EmptyState } from '@/shared/components';
import { PinCard } from './PinCard';
import type { PinResponse } from '../types/pin.types';
import type { PinSearchResult } from '@/modules/search';

type PinItem = PinResponse | PinSearchResult;

const isSearchResult = (pin: PinItem): pin is PinSearchResult => {
  return 'authorUsername' in pin && 'score' in pin;
};

const normalizePinForCard = (pin: PinItem): PinResponse => {
  if (isSearchResult(pin)) {
    return {
      id: pin.id,
      userId: pin.authorId,
      title: pin.title,
      description: pin.description,
      href: null,
      imageId: pin.imageId,
      thumbnailId: pin.thumbnailId,
      videoPreviewId: null,
      createdAt: pin.createdAt,
      updatedAt: pin.createdAt,
      tags: Array.from(pin.tags),
      isLiked: false,
      lastSavedBoardId: null,
      lastSavedBoardName: null,
      savedToBoardsCount: 0,
      saveCount: pin.saveCount,
      commentCount: pin.commentCount,
      likeCount: pin.likeCount,
      viewCount: 0,
      originalWidth: pin.originalWidth,
      originalHeight: pin.originalHeight,
      thumbnailWidth: 236,
      thumbnailHeight: Math.round((pin.originalHeight / pin.originalWidth) * 236),
    };
  }
  return pin;
};

interface PinGridProps {
  pins: PinItem[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  emptyMessage?: string;
  emptyAction?: {
    text: string;
    onClick: () => void;
  };
  showHighlights?: boolean;
}

const COLUMN_WIDTH = 236;
const GUTTER_WIDTH = 16;
const MIN_COLUMNS = 2;

interface GridItemProps {
  pin: PinItem;
  showHighlights: boolean;
}

const GridItem: React.FC<GridItemProps> = ({ pin, showHighlights }) => {
  const normalizedPin = normalizePinForCard(pin);
  const isSearch = isSearchResult(pin);
  
  const highlightedTitle = showHighlights && isSearch && pin.highlights?.title?.[0] 
    ? pin.highlights.title[0] 
    : undefined;
  
  return (
    <PinCard 
      pin={normalizedPin}
      highlightedTitle={highlightedTitle}
      showAuthor={isSearch}
      authorUsername={isSearch ? pin.authorUsername : undefined}
    />
  );
};

export const PinGrid: React.FC<PinGridProps> = ({
  pins,
  isLoading,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  emptyMessage = 'No pins found',
  emptyAction,
  showHighlights = false,
}) => {
  const getScrollContainer = useCallback((): HTMLElement | Window => {
    return globalThis.window;
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Fixed: renamed 'data' to 'pin' to avoid confusion with Masonry's internal naming
  const renderMasonryItem = useCallback(
    (props: { data: PinItem }) => {
      return <GridItem pin={props.data} showHighlights={showHighlights} />;
    },
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
        action={emptyAction}
      />
    );
  }

  return (
    <Box width="100%">
      <Masonry
        items={pins}
        renderItem={renderMasonryItem}
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