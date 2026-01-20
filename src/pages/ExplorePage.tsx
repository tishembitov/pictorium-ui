// src/pages/ExplorePage.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Divider, Flex } from 'gestalt';
import {
  ExploreHeader,
  ExploreTabs,
  ExploreHero,
  ExploreCategoryBar,
  ExploreSection,
  HorizontalPinCarousel,
  ExploreFeed,
  useExploreData,
  type ExploreTab,
} from '@/modules/explore';
import { TagChip } from '@/modules/tag';
import { buildPath } from '@/app/router/routes';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Local state
  const [activeTab, setActiveTab] = useState<ExploreTab>('foryou');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState('');

  // Fetch explore data
  const {
    categories,
    isCategoriesLoading,
    trending,
    pins,
    isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalHits,
    featuredCollection,
  } = useExploreData({
    activeTab,
    selectedCategory,
  });

  // Handlers
  const handleTabChange = useCallback((tab: ExploreTab) => {
    setActiveTab(tab);
    setSelectedCategory(undefined);
  }, []);

  const handleCategorySelect = useCallback((categoryName: string) => {
    setSelectedCategory((prev) => 
      prev === categoryName ? undefined : categoryName
    );
  }, []);

  const handleClearCategory = useCallback(() => {
    setSelectedCategory(undefined);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
    navigate(buildPath.search(query));
  }, [navigate]);

  const handleExploreCollection = useCallback((query: string) => {
    setSelectedCategory(query);
  }, []);

  const handleTrendingClick = useCallback((query: string) => {
    navigate(buildPath.search(query));
  }, [navigate]);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <Box paddingY={4}>
      {/* Header with Search */}
      <ExploreHeader
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Tabs */}
      <ExploreTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Hero Section (only on "For You" tab without category) */}
      {activeTab === 'foryou' && !selectedCategory && (
        <ExploreHero
          collection={featuredCollection}
          onExplore={handleExploreCollection}
        />
      )}

      {/* Category Bar */}
      <ExploreCategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        isLoading={isCategoriesLoading}
      />

      <Divider />

      {/* Trending Section (only on "Trending" tab) */}
      {activeTab === 'trending' && trending.length > 0 && (
        <ExploreSection
          title="Trending Searches"
          subtitle="What people are searching for right now"
        >
          <Flex wrap gap={2}>
            {trending.map((item, index) => (
              <TagChip
                key={item.query}
                tag={`${index + 1}. ${item.query}`}
                size="md"
                onClick={() => handleTrendingClick(item.query)}
              />
            ))}
          </Flex>
        </ExploreSection>
      )}

      {/* Popular Pins Carousel (on "For You" tab without category) */}
      {activeTab === 'foryou' && !selectedCategory && pins.length > 0 && (
        <ExploreSection
          title="Popular right now"
          showSeeAll
          onSeeAllClick={() => setActiveTab('trending')}
        >
          <HorizontalPinCarousel
            pins={pins.slice(0, 10)}
            isLoading={isPinsLoading}
          />
        </ExploreSection>
      )}

      {/* Main Feed */}
      <ExploreFeed
        pins={selectedCategory || activeTab !== 'foryou' ? pins : pins.slice(10)}
        isLoading={isPinsLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onFetchNextPage={handleFetchNextPage}
        totalHits={totalHits}
        selectedCategory={selectedCategory}
        onClearCategory={handleClearCategory}
        emptyMessage={
          selectedCategory
            ? `No pins found for "${selectedCategory}"`
            : 'Discover new ideas'
        }
      />
    </Box>
  );
};

export default ExplorePage;