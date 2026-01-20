// src/pages/ExplorePage.tsx

import React, { useState, useCallback } from 'react';
import { Box, Heading, Tabs, Divider, Flex, Button, Text, TapArea } from 'gestalt';
import { 
  CategoryGrid, 
  TagSearch, 
  TagList, 
  TagInput,
} from '@/modules/tag';
import type { CategoryResponse, TagResponse } from '@/modules/tag';
import { PinGrid } from '@/modules/pin';
import {
  useSearchPins,
  useTrending,
  SearchSortSelect,
  SearchAggregations,
  SearchResultsHeader,
} from '@/modules/search';
import type { SearchSortBy } from '@/modules/search';
import { EmptyState, LoadingSpinner } from '@/shared/components';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

type TabIndex = 0 | 1 | 2;

const ExplorePage: React.FC = () => {
  const isMobile = useIsMobile();
  
  // Local state
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SearchSortBy>('RELEVANCE');

  // Trending queries
  const { data: trending, isLoading: isTrendingLoading } = useTrending({ limit: 12 });

  // Pin search (for Pins tab)
  const {
    pins,
    totalHits,
    took,
    aggregations,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSearchPins({
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
    enabled: activeTab === 1,
  });

  // Handlers
  const handleCategoryClick = useCallback((category: CategoryResponse) => {
    setSelectedTags([category.tagName]);
    setActiveTab(1);
  }, []);

  const handleTagSelect = useCallback((tag: TagResponse) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag.name)) return prev;
      return [...prev, tag.name];
    });
    setActiveTab(1);
  }, []);

  const handleTagRemove = useCallback((tagName: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName));
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const handleTabChange = useCallback(({ activeTabIndex }: { activeTabIndex: number }) => {
    setActiveTab(activeTabIndex as TabIndex);
  }, []);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleTrendingClick = useCallback((query: string) => {
    setSelectedTags([query]);
    setActiveTab(1);
  }, []);

  const handleTagFromAggregations = useCallback((tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  }, [selectedTags]);

  // Tab labels
  const pinsTabLabel = selectedTags.length > 0 
    ? `Pins (${totalHits})` 
    : 'All Pins';

  return (
    <Box paddingY={4}>
      {/* Header */}
      <Flex justifyContent="between" alignItems="center" wrap>
        <Box>
          <Heading size="400" accessibilityLevel={1}>
            Explore
          </Heading>
          <Text color="subtle" size="200">
            Discover new ideas and inspiration
          </Text>
        </Box>

        {/* Tag Search */}
        <Box width={isMobile ? '100%' : 300} marginTop={isMobile ? 3 : 0}>
          <TagSearch
            placeholder="Search tags..."
            onTagSelect={handleTagSelect}
            navigateOnSelect={false}
          />
        </Box>
      </Flex>

      {/* Trending */}
      {!selectedTags.length && trending && trending.length > 0 && (
        <Box marginTop={4}>
          <Text weight="bold" size="200" color="subtle">
            Trending Searches
          </Text>
          <Box marginTop={2}>
            <Flex gap={2} wrap>
              {trending.map((item) => (
                <Button
                  key={item.query}
                  text={item.query}
                  onClick={() => handleTrendingClick(item.query)}
                  size="sm"
                  color="gray"
                />
              ))}
            </Flex>
          </Box>
        </Box>
      )}

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <Box marginTop={4}>
          <Flex alignItems="center" gap={2} wrap>
            <Text weight="bold" size="200">Filtering by:</Text>
            <TagList
              tags={selectedTags}
              size="md"
              removable
              onRemove={handleTagRemove}
            />
            <Button
              text="Clear all"
              onClick={handleClearTags}
              size="sm"
              color="gray"
            />
          </Flex>
        </Box>
      )}

      {/* Tabs */}
      <Box marginTop={4}>
        <Tabs
          activeTabIndex={activeTab}
          onChange={handleTabChange}
          tabs={[
            { href: '#categories', text: 'Categories' },
            { href: '#pins', text: pinsTabLabel },
            { href: '#trending', text: 'Trending' },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {/* Categories Tab */}
        {activeTab === 0 && (
          <Box>
            <CategoryGrid
              limit={12}
              size="lg"
              onCategoryClick={handleCategoryClick}
              showTitle={false}
            />
          </Box>
        )}

        {/* Pins Tab */}
        {activeTab === 1 && (
          <Box>
            {/* Filters Row */}
            <Box marginBottom={4}>
              <Flex gap={4} alignItems="end" wrap>
                {/* Sort */}
                <SearchSortSelect value={sortBy} onChange={setSortBy} />
                
                {/* Tag Input */}
                <Box flex="grow" maxWidth={400}>
                  <TagInput
                    id="explore-tags"
                    label="Filter by tags"
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    placeholder="Add more tags..."
                    maxTags={5}
                  />
                </Box>

                {/* Clear */}
                {selectedTags.length > 0 && (
                  <Button
                    text="Clear tags"
                    onClick={handleClearTags}
                    size="lg"
                    color="gray"
                  />
                )}
              </Flex>
            </Box>

            {/* Aggregations */}
            {aggregations && (
              <Box marginBottom={4}>
                <SearchAggregations
                  aggregations={aggregations}
                  onTagClick={handleTagFromAggregations}
                  compact
                />
              </Box>
            )}

            {/* Results Header */}
            {selectedTags.length > 0 && (
              <SearchResultsHeader
                query={selectedTags.join(', ')}
                totalHits={totalHits}
                took={took}
                type="pins"
                isLoading={isPinsLoading}
              />
            )}

            {/* Pins Grid */}
            <PinGrid
              pins={pins}
              isLoading={isPinsLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={handleFetchNextPage}
              showHighlights
              emptyMessage={
                selectedTags.length > 0
                  ? 'No pins found for selected tags'
                  : 'No pins to explore yet'
              }
              emptyAction={
                selectedTags.length > 0
                  ? { text: 'Clear tags', onClick: handleClearTags }
                  : undefined
              }
            />
          </Box>
        )}

        {/* Trending Tab */}
        {activeTab === 2 && (
          <TrendingTabContent
            trending={trending}
            isLoading={isTrendingLoading}
            onTrendingClick={handleTrendingClick}
          />
        )}
      </Box>
    </Box>
  );
};

// Extracted component for Trending tab to reduce complexity
interface TrendingTabContentProps {
  trending: Array<{ query: string; searchCount: number }> | undefined;
  isLoading: boolean;
  onTrendingClick: (query: string) => void;
}

const TrendingTabContent: React.FC<TrendingTabContentProps> = ({
  trending,
  isLoading,
  onTrendingClick,
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!trending || trending.length === 0) {
    return (
      <EmptyState
        title="No trending searches"
        description="Check back later for popular searches"
        icon="trending"
      />
    );
  }

  return (
    <Box>
      <Text weight="bold" size="300">
        Popular Searches
      </Text>
      <Box marginTop={4}>
        <Flex direction="column" gap={2}>
          {trending.map((item, index) => (
            <TapArea
              key={item.query}
              onTap={() => onTrendingClick(item.query)}
              rounding={3}
            >
              <Box
                padding={3}
                rounding={3}
                color="secondary"
              >
                <Flex alignItems="center" gap={3}>
                  <Text weight="bold" size="400" color="subtle">
                    {index + 1}
                  </Text>
                  <Box flex="grow">
                    <Text weight="bold" size="300">
                      {item.query}
                    </Text>
                  </Box>
                  <Text size="200" color="subtle">
                    {item.searchCount.toLocaleString()} searches
                  </Text>
                </Flex>
              </Box>
            </TapArea>
          ))}
        </Flex>
      </Box>
    </Box>
  );
};

export default ExplorePage;