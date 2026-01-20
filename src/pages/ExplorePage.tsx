// src/pages/ExplorePage.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Divider, Flex, Text, Icon } from 'gestalt';
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

  // Fetch explore data with personalization
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
    aggregations,
    isPersonalized,
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

  const handleTagClick = useCallback((tag: string) => {
    setSelectedCategory(tag);
  }, []);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  // Get tab description - extracted to avoid nested ternary
  const tabDescription = useMemo(() => {
    switch (activeTab) {
      case 'foryou':
        if (isPersonalized) {
          return 'Curated picks based on your interests';
        }
        return 'Popular pins from the community';
      case 'trending':
        return "What's popular right now";
      case 'today':
        return 'Fresh ideas from today';
      default:
        return '';
    }
  }, [activeTab, isPersonalized]);

  // Get carousel section title
  const carouselTitle = useMemo(() => {
    return isPersonalized ? 'Picked for you' : 'Popular right now';
  }, [isPersonalized]);

  // Get empty message for feed
  const emptyMessage = useMemo(() => {
    if (selectedCategory) {
      return `No pins found for "${selectedCategory}"`;
    }
    if (activeTab === 'today') {
      return 'No new pins today yet';
    }
    return 'Discover new ideas';
  }, [selectedCategory, activeTab]);

  // Determine if we should show personalization indicator
  const showPersonalizationIndicator = isPersonalized && activeTab === 'foryou';

  // Determine which pins to show in carousel vs feed
  const carouselPins = pins.slice(0, 10);
  const feedPins = selectedCategory || activeTab !== 'foryou' 
    ? pins 
    : pins.slice(10);

  // Should show hero section
  const showHero = activeTab === 'foryou' && !selectedCategory;

  // Should show trending section
  const showTrending = activeTab === 'trending' && trending.length > 0;

  // Should show carousel
  const showCarousel = activeTab === 'foryou' && !selectedCategory && pins.length > 0;

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

      {/* Tab description */}
      <Box marginBottom={4}>
        <Flex alignItems="center" justifyContent="center" gap={2}>
          {showPersonalizationIndicator && (
            <Icon 
              accessibilityLabel="Personalized" 
              icon="sparkle" 
              size={16} 
              color="subtle"
            />
          )}
          <Text align="center" color="subtle" size="200">
            {tabDescription}
          </Text>
        </Flex>
      </Box>

      {/* Hero Section */}
      {showHero && (
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

      {/* Trending Section */}
      {showTrending && (
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

      {/* Popular Pins Carousel */}
      {showCarousel && (
        <ExploreSection
          title={carouselTitle}
          showSeeAll
          onSeeAllClick={() => setActiveTab('trending')}
        >
          <HorizontalPinCarousel
            pins={carouselPins}
            isLoading={isPinsLoading}
          />
        </ExploreSection>
      )}

      {/* Main Feed */}
      <ExploreFeed
        pins={feedPins}
        isLoading={isPinsLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onFetchNextPage={handleFetchNextPage}
        totalHits={totalHits}
        selectedCategory={selectedCategory}
        onClearCategory={handleClearCategory}
        aggregations={aggregations}
        isPersonalized={showPersonalizationIndicator}
        onTagClick={handleTagClick}
        emptyMessage={emptyMessage}
      />
    </Box>
  );
};

export default ExplorePage;