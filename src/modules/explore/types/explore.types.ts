// src/modules/explore/types/explore.types.ts

import type { PinSearchResult, Aggregations, TrendingQuery } from '@/modules/search';
import type { CategoryResponse } from '@/modules/tag';
/**
 * Explore page tabs
 */
export type ExploreTab = 'foryou' | 'trending' | 'today';

export interface ExploreTabConfig {
  id: ExploreTab;
  label: string;
  icon?: string;
}

export const EXPLORE_TABS: ExploreTabConfig[] = [
  { id: 'foryou', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'today', label: 'Today' },
];

/**
 * Featured collection for hero section
 */
export interface FeaturedCollection {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageId?: string;
  query: string;
  gradient?: string;
}

/**
 * Category with icon for category bar
 */
export interface ExploreCategoryItem {
  id: string;
  name: string;
  icon?: string;
  emoji?: string;
  imageId?: string;
}

/**
 * Section configuration
 */
export interface ExploreSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  showSeeAll?: boolean;
  seeAllLink?: string;
}

/**
 * Explore data aggregation - updated to use search types
 */
export interface ExploreData {
  categories: CategoryResponse[];
  trending: TrendingQuery[];
  featuredPins: PinSearchResult[];  // ✅ Changed from PinResponse
  aggregations?: Aggregations;       // ✅ Added
  isLoading: boolean;
  isError: boolean;
  isPersonalized: boolean;           // ✅ Added
}

/**
 * Category icons mapping
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'art': '🎨',
  'home': '🏠',
  'food': '🍕',
  'fashion': '👗',
  'travel': '✈️',
  'diy': '🔨',
  'fitness': '💪',
  'beauty': '💄',
  'photography': '📷',
  'nature': '🌿',
  'animals': '🐾',
  'quotes': '💬',
  'wedding': '💒',
  'cars': '🚗',
  'tech': '💻',
  'music': '🎵',
  'movies': '🎬',
  'books': '📚',
  'garden': '🌸',
  'kids': '👶',
};

/**
 * Get emoji for category
 */
export const getCategoryEmoji = (categoryName: string): string => {
  const normalized = categoryName.toLowerCase();
  
  // Check exact match
  if (CATEGORY_ICONS[normalized]) {
    return CATEGORY_ICONS[normalized];
  }
  
  // Check partial match
  for (const [key, emoji] of Object.entries(CATEGORY_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return emoji;
    }
  }
  
  // Default emoji
  return '✨';
};