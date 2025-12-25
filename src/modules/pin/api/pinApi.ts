// src/modules/pin/api/pinApi.ts

import { get, post, patch, del } from '@/shared/api/apiClient';
import { PIN_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type {
  PinResponse,
  PinCreateRequest,
  PinUpdateRequest,
  PagePinResponse,
} from '../types/pin.types';
import type { PinFilter } from '../types/pinFilter.types';

/**
 * Convert PinFilter to query params
 */
const createFilterParams = (filter: PinFilter): Record<string, unknown> => {
  const params: Record<string, unknown> = {};
  
  if (filter.q) params.q = filter.q;
  if (filter.tags?.length) params.tags = filter.tags;
  if (filter.authorId) params.authorId = filter.authorId;
  if (filter.savedBy) params.savedBy = filter.savedBy;
  if (filter.savedToProfileBy) params.savedToProfileBy = filter.savedToProfileBy;
  if (filter.likedBy) params.likedBy = filter.likedBy;
  if (filter.relatedTo) params.relatedTo = filter.relatedTo;
  if (filter.createdFrom) params.createdFrom = filter.createdFrom;
  if (filter.createdTo) params.createdTo = filter.createdTo;
  if (filter.scope) params.scope = filter.scope;
  
  return params;
};

/**
 * Pin API client
 */
export const pinApi = {
  // ==================== Pin CRUD ====================
  
  /**
   * Get pins with filter and pagination
   */
  getAll: (filter: PinFilter = {}, pageable: Pageable = {}) => {
    return get<PagePinResponse>(PIN_ENDPOINTS.list(), {
      params: {
        ...createFilterParams(filter),
        ...createPaginationParams(pageable),
      },
    });
  },

  /**
   * Get pin by ID
   */
  getById: (pinId: string) => {
    return get<PinResponse>(PIN_ENDPOINTS.byId(pinId));
  },

  /**
   * Create new pin
   */
  create: (data: PinCreateRequest) => {
    return post<PinResponse, PinCreateRequest>(PIN_ENDPOINTS.create(), data);
  },

  /**
   * Update pin
   */
  update: (pinId: string, data: PinUpdateRequest) => {
    return patch<PinResponse, PinUpdateRequest>(PIN_ENDPOINTS.update(pinId), data);
  },

  /**
   * Delete pin
   */
  delete: (pinId: string) => {
    return del<void>(PIN_ENDPOINTS.delete(pinId));
  },

  // ==================== Save to Profile ====================

  /**
   * Save pin to profile (without board)
   */
  saveToProfile: (pinId: string) => {
    return post<PinResponse>(PIN_ENDPOINTS.save(pinId));
  },

  /**
   * Unsave pin from profile
   */
  unsaveFromProfile: (pinId: string) => {
    return del<void>(PIN_ENDPOINTS.unsave(pinId));
  },

  /**
   * Get pins saved to profile by user ID
   */
  getSavedToProfilePins: (userId: string, pageable: Pageable = {}) => {
    return get<PagePinResponse>(PIN_ENDPOINTS.savedByUser(userId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Get my pins saved to profile
   */
  getMySavedToProfilePins: (pageable: Pageable = {}) => {
    return get<PagePinResponse>(PIN_ENDPOINTS.mySaved(), {
      params: createPaginationParams(pageable),
    });
  },
};

export default pinApi;