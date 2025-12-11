// Sort direction
export type SortDirection = 'asc' | 'desc';

// Sort object from Spring
export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

// Pageable object from Spring
export interface PageableObject {
  offset: number;
  sort: SortObject;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

// Pageable request params
export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

// Page response from Spring
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: SortObject;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: PageableObject;
  empty: boolean;
}

// Simplified page info for UI
export interface PageInfo {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
  isEmpty: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Infinite scroll page result
export interface InfinitePageResult<T> {
  items: T[];
  nextPage: number | undefined;
  hasMore: boolean;
  totalElements: number;
}

// Helper to extract page info from PageResponse
export const extractPageInfo = <T>(page: PageResponse<T>): PageInfo => ({
  currentPage: page.number,
  totalPages: page.totalPages,
  totalElements: page.totalElements,
  pageSize: page.size,
  isFirst: page.first,
  isLast: page.last,
  isEmpty: page.empty,
  hasNext: !page.last,
  hasPrevious: !page.first,
});

// Helper to create pageable params
export const createPageable = (
  page: number = 0,
  size: number = 20,
  sort?: string | string[]
): Pageable => ({
  page,
  size,
  sort: sort ? (Array.isArray(sort) ? sort : [sort]) : undefined,
});

// Default pagination values
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 0;

export const DEFAULT_PAGEABLE: Pageable = {
  page: DEFAULT_PAGE,
  size: DEFAULT_PAGE_SIZE,
};