// src/modules/pin/api/pinLikeApi.ts

import { get, post, del } from '@/shared/api/apiClient';
import { PIN_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type { PinResponse } from '../types/pin.types';
import type { PageLikeResponse } from '../types/pinLike.types';

/**
 * Pin Like API client
 */
export const pinLikeApi = {
  /**
   * Get likes for a pin
   */
  getLikes: (pinId: string, pageable: Pageable = {}) => {
    return get<PageLikeResponse>(PIN_ENDPOINTS.likes(pinId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Like a pin
   * @returns Updated PinResponse
   */
  like: (pinId: string) => {
    return post<PinResponse>(PIN_ENDPOINTS.like(pinId));
  },

  /**
   * Unlike a pin
   * @returns Updated PinResponse
   */
  unlike: (pinId: string) => {
    return del<PinResponse>(PIN_ENDPOINTS.unlike(pinId));
  },
};

export default pinLikeApi;