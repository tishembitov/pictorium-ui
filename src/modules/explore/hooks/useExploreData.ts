// src/modules/explore/hooks/useExploreData.ts

import { useMemo, useState} from 'react';
import { useCategories } from '@/modules/tag';
import { useTrending } from '@/modules/search';
import { usePins } from '@/modules/pin';
import type { ExploreTab, FeaturedCollection } from '../types/explore.types';

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

export const useExploreData = (options: UseExploreDataOptions) => {
  const { selectedCategory } = options;

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

  // Build filter for pins based on tab and category
  const pinFilter = useMemo(() => {
    if (selectedCategory) {
      return { tags: [selectedCategory] };
    }
    return {};
  }, [selectedCategory]);

  // Pins using usePins hook (supports PinResponse)
  const {
    pins: feedPins,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalElements,
  } = usePins(pinFilter, {
    enabled: true,
    pageSize: 25,
  });

  // Featured collection for hero
  const featuredCollection = useMemo(() => {
    const collection = FEATURED_COLLECTIONS[featuredIndex] || FEATURED_COLLECTIONS[0];
    return collection;
  }, [featuredIndex]);

  // Get first pin image for hero if no static image
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
    
    // Pins
    pins: feedPins,
    isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalHits: totalElements,
    
    // Featured
    featuredCollection: {
      ...featuredCollection,
      imageId: heroImageId,
    } as FeaturedCollection & { imageId?: string | null },
    
    // Overall loading state
    isLoading: isCategoriesLoading || isPinsLoading,
  };
};

export default useExploreData;