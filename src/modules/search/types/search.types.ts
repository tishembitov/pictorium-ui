// src/modules/search/types/search.types.ts

/**
 * Search sort options
 */
export type SearchSortBy = 'RELEVANCE' | 'RECENT' | 'POPULAR' | 'LIKES' | 'SAVES';
export type SearchSortOrder = 'ASC' | 'DESC';
export type SearchType = 'PINS' | 'USERS' | 'BOARDS' | 'ALL';
export type SuggestionType = 'PIN_TITLE' | 'TAG' | 'USERNAME';

/**
 * Search criteria for POST requests
 */
export interface SearchCriteria {
  query?: string;
  types?: SearchType[];
  tags?: string[];
  authorId?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  page?: number;
  size?: number;
  fuzzy?: boolean;
  highlight?: boolean;
  personalized?: boolean;
}

/**
 * Pin search params for GET requests
 */
export interface PinSearchParams {
  q?: string;
  tags?: string[];
  authorId?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  page?: number;
  size?: number;
  fuzzy?: boolean;
  highlight?: boolean;
  personalized?: boolean;
}

/**
 * User search params
 */
export interface UserSearchParams {
  q: string;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  page?: number;
  size?: number;
  fuzzy?: boolean;
  highlight?: boolean;
}

/**
 * Board search params
 */
export interface BoardSearchParams {
  q: string;
  userId?: string;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  page?: number;
  size?: number;
  fuzzy?: boolean;
  highlight?: boolean;
}

/**
 * Highlights from search results
 */
export type Highlights = Record<string, string[]>;

/**
 * Tag count in aggregations
 */
export interface TagCount {
  tag: string;
  count: number;
}

/**
 * Author count in aggregations
 */
export interface AuthorCount {
  authorId: string;
  authorUsername: string;
  count: number;
}

/**
 * Search aggregations
 */
export interface Aggregations {
  topTags?: TagCount[];
  topAuthors?: AuthorCount[];
}

/**
 * Pin search result
 */
export interface PinSearchResult {
  id: string;
  title: string | null;
  description: string | null;
  tags: string[];
  authorId: string;
  authorUsername: string;
  imageId: string;
  thumbnailId: string | null;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  originalWidth: number;
  originalHeight: number;
  createdAt: string;
  highlights?: Highlights;
  score: number;
}

/**
 * User search result
 */
export interface UserSearchResult {
  id: string;
  username: string;
  description: string | null;
  imageId: string | null;
  bannerImageId: string | null;
  followerCount: number;
  followingCount: number;
  pinCount: number;
  createdAt: string;
  highlights?: Highlights;
  score: number;
}

/**
 * Board search result
 */
export interface BoardSearchResult {
  id: string;
  title: string;
  userId: string;
  username: string;
  pinCount: number;
  previewImageId: string | null;
  createdAt: string;
  highlights?: Highlights;
  score: number;
}

/**
 * Generic search result wrapper
 */
export interface SearchResult<T> {
  results: T[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  took: number;
  query: string;
  aggregations?: Aggregations;
}

/**
 * Pin search response
 */
export type PinSearchResponse = SearchResult<PinSearchResult>;

/**
 * User search response
 */
export type UserSearchResponse = SearchResult<UserSearchResult>;

/**
 * Board search response
 */
export type BoardSearchResponse = SearchResult<BoardSearchResult>;

/**
 * Universal search response
 */
export interface UniversalSearchResponse {
  pins: PinSearchResult[];
  users: UserSearchResult[];
  boards: BoardSearchResult[];
  totalPins: number;
  totalUsers: number;
  totalBoards: number;
  took: number;
  query: string;
  hasMorePins: boolean;
  hasMoreUsers: boolean;
  hasMoreBoards: boolean;
}

/**
 * Suggestion item
 */
export interface Suggestion {
  text: string;
  type: SuggestionType;
  imageId: string | null;
  score: number;
}

/**
 * Suggest response
 */
export interface SuggestResponse {
  suggestions: Suggestion[];
}

/**
 * Trending query
 */
export interface TrendingQuery {
  query: string;
  searchCount: number;
}

/**
 * Search history item
 */
export interface SearchHistoryItem {
  query: string;
  searchType: string;
  searchCount: number;
  lastSearchedAt: string;
}

/**
 * Search filter state for UI
 */
export interface SearchFiltersState {
  query: string;
  tags: string[];
  authorId?: string;
  createdFrom?: Date | null;
  createdTo?: Date | null;
  sortBy: SearchSortBy;
  sortOrder: SearchSortOrder;
  fuzzy: boolean;
  personalized: boolean;
}

/**
 * Sort option for UI
 */
export interface SearchSortOption {
  value: SearchSortBy;
  label: string;
  icon?: string;
}