// src/shared/components/data-display/MasonryGrid.tsx
import React, { useCallback, type ComponentType } from 'react';
import { Masonry, Box, Spinner } from 'gestalt';

interface MasonryGridProps<T> {
  readonly items: readonly T[];
  readonly renderItem: ComponentType<{ data: T; itemIdx: number }>;
  readonly columnWidth?: number;
  readonly gutterWidth?: number;
  readonly minCols?: number;
  readonly loadMore?: () => void;
  readonly hasMore?: boolean;
  readonly isLoading?: boolean;
  readonly scrollContainer?: () => HTMLElement;
}

export function MasonryGrid<T extends { id: string }>({
  items,
  renderItem: RenderItem,
  columnWidth = 236,
  gutterWidth = 16,
  minCols = 2,
  loadMore,
  hasMore = false,
  isLoading = false,
  scrollContainer,
}: MasonryGridProps<T>): React.ReactElement {
  const handleLoadMore = useCallback((): void => {
    if (!isLoading && hasMore && loadMore) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  const renderMasonryItem = useCallback(
    (props: { data: T; itemIdx: number }) => {
      return <RenderItem data={props.data} itemIdx={props.itemIdx} />;
    },
    [RenderItem]
  );

  // Convert readonly array to mutable for Masonry
  const mutableItems = items as T[];

  return (
    <Box width="100%">
      <Masonry
        items={mutableItems}
        renderItem={renderMasonryItem}
        columnWidth={columnWidth}
        gutterWidth={gutterWidth}
        minCols={minCols}
        loadItems={handleLoadMore}
        scrollContainer={scrollContainer}
        virtualize
      />
      
      {isLoading && (
        <Box display="flex" justifyContent="center" padding={6}>
          <Spinner accessibilityLabel="Loading more items" show />
        </Box>
      )}
    </Box>
  );
}

export default MasonryGrid;