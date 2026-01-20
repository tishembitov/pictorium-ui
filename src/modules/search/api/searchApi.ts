// src/modules/search/api/searchApi.ts

import { get, post, del } from '@/shared/api/apiClient';
import type {
  PinSearchParams,
  UserSearchParams,
  BoardSearchParams,
  SearchCriteria,
  PinSearchResponse,
  UserSearchResponse,
  BoardSearchResponse,
  UniversalSearchResponse,
  SuggestResponse,
  TrendingQuery,
  SearchHistoryItem,
} from '../types/search.types';

const SEARCH_PREFIX = '/api/v1/search';

/**
 * Cleans undefined/null values from params
 */
const cleanParams = (params: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => 
      v !== undefined && 
      v !== null && 
      v !== '' &&
      !(Array.isArray(v) && v.length === 0)
    )
  );
};

/**
 * Search API client
 */
export const searchApi = {
  // ==================== Universal Search ====================
  
  /**
   * Search across all types (pins, users, boards)
   */
  searchAll: (q: string, options: { size?: number; fuzzy?: boolean } = {}) => {
    return get<UniversalSearchResponse>(SEARCH_PREFIX, {
      params: cleanParams({
        q,
        size: options.size ?? 10,
        fuzzy: options.fuzzy ?? true,
      }),
    });
  },

  // ==================== Pin Search ====================
  
  /**
   * Search pins with GET
   */
  searchPins: (params: PinSearchParams) => {
    return get<PinSearchResponse>(`${SEARCH_PREFIX}/pins`, {
      params: cleanParams({
        q: params.q,
        tags: params.tags?.join(','),
        authorId: params.authorId,
        createdFrom: params.createdFrom,
        createdTo: params.createdTo,
        sortBy: params.sortBy ?? 'RELEVANCE',
        sortOrder: params.sortOrder ?? 'DESC',
        page: params.page ?? 0,
        size: params.size ?? 20,
        fuzzy: params.fuzzy ?? true,
        highlight: params.highlight ?? true,
        personalized: params.personalized ?? true,
      }),
    });
  },

  /**
   * Search pins with POST (for complex queries)
   */
  searchPinsPost: (criteria: SearchCriteria) => {
    return post<PinSearchResponse, SearchCriteria>(`${SEARCH_PREFIX}/pins`, criteria);
  },

  /**
   * Find similar pins
   */
  findSimilarPins: (pinId: string, limit: number = 20) => {
    return get<PinSearchResponse>(`${SEARCH_PREFIX}/pins/${pinId}/similar`, {
      params: { limit },
    });
  },

  // ==================== User Search ====================
  
  /**
   * Search users
   */
  searchUsers: (params: UserSearchParams) => {
    return get<UserSearchResponse>(`${SEARCH_PREFIX}/users`, {
      params: cleanParams({
        q: params.q,
        sortBy: params.sortBy ?? 'RELEVANCE',
        sortOrder: params.sortOrder ?? 'DESC',
        page: params.page ?? 0,
        size: params.size ?? 20,
        fuzzy: params.fuzzy ?? true,
        highlight: params.highlight ?? true,
      }),
    });
  },

  // ==================== Board Search ====================
  
  /**
   * Search boards
   */
  searchBoards: (params: BoardSearchParams) => {
    return get<BoardSearchResponse>(`${SEARCH_PREFIX}/boards`, {
      params: cleanParams({
        q: params.q,
        userId: params.userId,
        sortBy: params.sortBy ?? 'RELEVANCE',
        sortOrder: params.sortOrder ?? 'DESC',
        page: params.page ?? 0,
        size: params.size ?? 20,
        fuzzy: params.fuzzy ?? true,
        highlight: params.highlight ?? true,
      }),
    });
  },

  // ==================== Suggestions ====================
  
  /**
   * Get search suggestions
   */
  suggest: (q: string, limit: number = 10) => {
    return get<SuggestResponse>(`${SEARCH_PREFIX}/suggest`, {
      params: { q, limit },
    });
  },

  // ==================== Trending ====================
  
  /**
   * Get trending search queries
   */
  getTrending: (limit: number = 10) => {
    return get<TrendingQuery[]>(`${SEARCH_PREFIX}/trending`, {
      params: { limit },
    });
  },

  // ==================== History ====================
  
  /**
   * Get user's search history
   */
  getHistory: (limit: number = 20) => {
    return get<SearchHistoryItem[]>(`${SEARCH_PREFIX}/history`, {
      params: { limit },
    });
  },

  /**
   * Clear user's search history
   */
  clearHistory: () => {
    return del<Record<string, string>>(`${SEARCH_PREFIX}/history`);
  },
};

export default searchApi;