// src/modules/tag/api/tagApi.ts

import { get } from '@/shared/api/apiClient';
import { TAG_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { PageResponse, Pageable } from '@/shared/types/pageable.types';
import type { TagResponse, TagSearchParams } from '../types/tag.types';
import type { CategoryResponse } from '../types/category.types';

/**
 * Tag API client
 */
export const tagApi = {
  /**
   * Get all tags with pagination
   */
  getAll: (pageable: Pageable = {}) => {
    return get<PageResponse<TagResponse>>(TAG_ENDPOINTS.list(), {
      params: {
        page: pageable.page ?? 0,
        size: pageable.size ?? 20,
        sort: pageable.sort,
      },
    });
  },

  /**
   * Get tag by ID
   */
  getById: (tagId: string) => {
    return get<TagResponse>(TAG_ENDPOINTS.byId(tagId));
  },

  /**
   * Search tags by query
   */
  search: (params: TagSearchParams) => {
    return get<TagResponse[]>(TAG_ENDPOINTS.search(), {
      params: {
        q: params.q,
        limit: params.limit ?? 10,
      },
    });
  },

  /**
   * Get tags for a specific pin
   */
  getByPin: (pinId: string) => {
    return get<TagResponse[]>(TAG_ENDPOINTS.byPin(pinId));
  },

  /**
   * Get categories (tags with representative pins)
   */
  getCategories: (limit?: number) => {
    return get<CategoryResponse[]>(TAG_ENDPOINTS.categories(), {
      params: limit ? { limit } : undefined,
    });
  },
};

export default tagApi;