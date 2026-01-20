// src/modules/explore/components/ExploreFeed.tsx

import React from 'react';
import { Box, Spinner, Text, Flex, Icon } from 'gestalt';
import { SearchPinGrid, SearchAggregations, type PinSearchResult, type Aggregations } from '@/modules/search';
import { EmptyState } from '@/shared/components';

interface ExploreFeedProps {
  pins: PinSearchResult[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => void;
  totalHits?: number;
  emptyMessage?: string;
  selectedCategory?: string;
  onClearCategory?: () => void;
  aggregations?: Aggregations;
  isPersonalized?: boolean;
  onTagClick?: (tag: string) => void;
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
  aggregations,
  isPersonalized = false,
  onTagClick,
}) => {
  return (
    <Box marginTop={6}>
      {/* Personalization indicator */}
      {isPersonalized && !selectedCategory && pins.length > 0 && (
        <Box marginBottom={3}>
          <Flex alignItems="center" gap={2}>
            <Icon 
              accessibilityLabel="Personalized" 
              icon="sparkle" 
              size={16} 
              color="subtle" 
            />
            <Text size="200" color="subtle">
              Personalized for you based on your activity
            </Text>
          </Flex>
        </Box>
      )}

      {/* Results count */}
      {totalHits !== undefined && totalHits > 0 && selectedCategory && (
        <Box marginBottom={4}>
          <Text color="subtle" size="200">
            {totalHits.toLocaleString()} pins in "{selectedCategory}"
          </Text>
        </Box>
      )}

      {/* Related tags from aggregations */}
      {aggregations && !selectedCategory && (
        <Box marginBottom={4}>
          <SearchAggregations
            aggregations={aggregations}
            onTagClick={onTagClick}
            compact
          />
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

      {/* Pins Grid - using SearchPinGrid for PinSearchResult */}
      {pins.length > 0 && (
        <SearchPinGrid
          pins={pins}
          isLoading={false}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={onFetchNextPage}
          showHighlights={false} // No highlights for feed
        />
      )}
    </Box>
  );
};

export default ExploreFeed;