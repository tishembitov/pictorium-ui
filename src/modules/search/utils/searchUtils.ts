// src/modules/search/utils/searchUtils.ts

import type { Highlights, SearchSortBy, SearchSortOption } from '../types/search.types';

/**
 * Sort options for UI
 */
export const SEARCH_SORT_OPTIONS: SearchSortOption[] = [
  { value: 'RELEVANCE', label: 'Most Relevant' },
  { value: 'RECENT', label: 'Most Recent' },
  { value: 'POPULAR', label: 'Most Popular' },
  { value: 'LIKES', label: 'Most Liked' },
  { value: 'SAVES', label: 'Most Saved' },
];

/**
 * Get sort option by value
 */
export const getSortOption = (value: SearchSortBy): SearchSortOption | undefined => {
  return SEARCH_SORT_OPTIONS.find((opt) => opt.value === value);
};

/**
 * Get highlighted text or fallback
 */
export const getHighlightedText = (
  highlights: Highlights | undefined,
  field: string,
  fallback: string | null
): string => {
  if (highlights?.[field]?.length) {
    return highlights[field][0] ?? fallback ?? '';
  }
  return fallback ?? '';
};

/**
 * Check if has any highlights
 */
export const hasHighlights = (highlights: Highlights | undefined): boolean => {
  if (!highlights) return false;
  return Object.values(highlights).some((arr) => arr.length > 0);
};

/**
 * Format search took time
 */
export const formatTookTime = (took: number): string => {
  if (took < 1000) {
    return `${took}ms`;
  }
  return `${(took / 1000).toFixed(2)}s`;
};

/**
 * Format total hits count
 */
export const formatTotalHits = (totalHits: number): string => {
  if (totalHits >= 1000000) {
    return `${(totalHits / 1000000).toFixed(1)}M`;
  }
  if (totalHits >= 1000) {
    return `${(totalHits / 1000).toFixed(1)}K`;
  }
  return totalHits.toString();
};

/**
 * Build search URL with params
 */
export const buildSearchUrl = (
  query: string,
  params?: {
    type?: 'pins' | 'users' | 'boards';
    tags?: string[];
    sortBy?: SearchSortBy;
  }
): string => {
  const searchParams = new URLSearchParams();
  searchParams.set('q', query);
  
  if (params?.type) {
    searchParams.set('type', params.type);
  }
  if (params?.tags?.length) {
    searchParams.set('tags', params.tags.join(','));
  }
  if (params?.sortBy && params.sortBy !== 'RELEVANCE') {
    searchParams.set('sort', params.sortBy);
  }
  
  return `/search?${searchParams.toString()}`;
};

/**
 * Parse search URL params
 */
export const parseSearchUrl = (searchParams: URLSearchParams): {
  query: string;
  type?: 'pins' | 'users' | 'boards';
  tags?: string[];
  sortBy?: SearchSortBy;
} => {
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') as 'pins' | 'users' | 'boards' | null;
  const tagsParam = searchParams.get('tags');
  const sortBy = searchParams.get('sort') as SearchSortBy | null;
  
  return {
    query,
    type: type || undefined,
    tags: tagsParam ? tagsParam.split(',').filter(Boolean) : undefined,
    sortBy: sortBy || undefined,
  };
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replaceAll(/\s+/g, ' ')
    .slice(0, 200);
};