// src/modules/explore/hooks/useExploreData.ts

import { useMemo, useState } from 'react';
import { useCategories } from '@/modules/tag';
import type { ExploreTab, FeaturedCollection } from '../types/explore.types';
import { useTrending } from '@/modules/search';
import usePersonalizedFeed from './usePersonalizedFeed';

interface UseExploreDataOptions {
  activeTab: ExploreTab;
  selectedCategory?: string;
}

// Static featured collections (could come from API in future)
const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  {
    id: 'spring-home',
    title: 'Spring Home Refresh',
    subtitle: 'Transform your space with seasonal inspiration',
    imageUrl: '',
    query: 'spring home decor',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'minimal-design',
    title: 'Minimal & Modern',
    subtitle: 'Clean aesthetics for everyday life',
    imageUrl: '',
    query: 'minimal design',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'creative-ideas',
    title: 'Get Creative',
    subtitle: 'DIY projects and artistic inspiration',
    imageUrl: '',
    query: 'creative diy',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
];

const getTodayStartMs = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime().toString();
};


export const useExploreData = (options: UseExploreDataOptions) => {
  const { activeTab, selectedCategory } = options;

  // State for featured collection index (determined once on mount)
  const [featuredIndex] = useState(() => {
    return Math.floor(Math.random() * FEATURED_COLLECTIONS.length);
  });

  // Categories for category bar
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useCategories({ limit: 12 });

  // Trending queries
  const {
    data: trending,
    isLoading: isTrendingLoading,
  } = useTrending({ limit: 10 });

  // ============================================
  // PERSONALIZED FEED CONFIGURATION
  // ============================================
  
  // Determine sort based on active tab
  const sortBy = useMemo(() => {
    switch (activeTab) {
      case 'trending':
        return 'POPULAR' as const;
      case 'today':
        return 'RECENT' as const;
      case 'foryou':
      default:
        // For "For You" - let the hook decide based on auth status
        // Authenticated: RELEVANCE (personalized)
        // Anonymous: POPULAR (fallback)
        return undefined;
    }
  }, [activeTab]);

  // Tags filter based on selected category
  const tags = useMemo(() => {
    return selectedCategory ? [selectedCategory] : undefined;
  }, [selectedCategory]);

  // Date filter for "Today" tab
  const createdFrom = useMemo(() => {
    return activeTab === 'today' ? getTodayStartMs() : undefined;
  }, [activeTab]);

  // ✅ Use personalized feed from search service
  const {
    pins: feedPins,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalHits: totalElements,
    aggregations,
    isPersonalized,
  } = usePersonalizedFeed({
    tags,
    sortBy,
    createdFrom,
    enabled: true,
    pageSize: 25,
  });

  // Featured collection for hero
  const featuredCollection = useMemo(() => {
    const collection = FEATURED_COLLECTIONS[featuredIndex] || FEATURED_COLLECTIONS[0];
    return collection;
  }, [featuredIndex]);

  // Get first category image for hero if no static image
  const heroImageId = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories[0]?.pin?.imageId || categories[0]?.pin?.thumbnailId;
    }
    return null;
  }, [categories]);

  return {
    // Categories
    categories: categories || [],
    isCategoriesLoading,
    isCategoriesError,
    
    // Trending
    trending: trending || [],
    isTrendingLoading,
    
    // Pins (now from search service with personalization!)
    pins: feedPins,
    isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalHits: totalElements,
    
    // Aggregations from search (related tags, top authors)
    aggregations,
    
    // Featured
    featuredCollection: {
      ...featuredCollection,
      imageId: heroImageId,
    } as FeaturedCollection & { imageId?: string | null },
    
    // Overall loading state
    isLoading: isCategoriesLoading || isPinsLoading,
    
    // ✅ New: indicate if feed is personalized
    isPersonalized,
  };
};

export default useExploreData;