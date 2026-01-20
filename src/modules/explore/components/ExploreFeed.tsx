// src/modules/explore/components/ExploreFeed.tsx

import React from 'react';
import { Box, Spinner, Text } from 'gestalt';
import { PinGrid } from '@/modules/pin';
import type { PinResponse } from '@/modules/pin';
import { EmptyState } from '@/shared/components';

interface ExploreFeedProps {
  pins: PinResponse[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => void;
  totalHits?: number;
  emptyMessage?: string;
  selectedCategory?: string;
  onClearCategory?: () => void;
}

export const ExploreFeed: React.FC<ExploreFeedProps> = ({
  pins,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onFetchNextPage,
  totalHits,
  emptyMessage = 'No pins to explore',
  selectedCategory,
  onClearCategory,
}) => {
  return (
    <Box marginTop={6}>
      {/* Results count */}
      {totalHits !== undefined && totalHits > 0 && selectedCategory && (
        <Box marginBottom={4}>
          <Text color="subtle" size="200">
            {totalHits.toLocaleString()} pins in "{selectedCategory}"
          </Text>
        </Box>
      )}

      {/* Loading state */}
      {isLoading && pins.length === 0 && (
        <Box display="flex" justifyContent="center" padding={8}>
          <Spinner accessibilityLabel="Loading pins" show />
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && pins.length === 0 && (
        <EmptyState
          title={emptyMessage}
          description="Try exploring different categories"
          icon="pin"
          action={
            onClearCategory && selectedCategory
              ? { text: 'Clear filter', onClick: onClearCategory }
              : undefined
          }
        />
      )}

      {/* Pins Grid */}
      {pins.length > 0 && (
        <PinGrid
          pins={pins}
          isLoading={false}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={onFetchNextPage}
        />
      )}
    </Box>
  );
};

export default ExploreFeed;