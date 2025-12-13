// src/modules/tag/types/tag.types.ts

/**
 * Tag response from API
 */
export interface TagResponse {
    id: string;
    name: string;
  }
  
  /**
   * Tag for display with optional metadata
   */
  export interface Tag extends TagResponse {
    pinCount?: number;
  }
  
  /**
   * Tag search params
   */
  export interface TagSearchParams {
    q: string;
    limit?: number;
  }
  
  /**
   * Tag filter for components
   */
  export interface TagFilter {
    selected: string[];
    available: TagResponse[];
  }