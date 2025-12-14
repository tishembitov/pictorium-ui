// src/modules/pin/api/savedPinApi.ts

import { post, del } from '@/shared/api/apiClient';
import { PIN_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { PinResponse } from '../types/pin.types';

/**
 * Saved Pin API client
 */
export const savedPinApi = {
  /**
   * Save a pin
   */
  save: (pinId: string) => {
    return post<PinResponse>(PIN_ENDPOINTS.save(pinId));
  },

  /**
   * Unsave a pin
   */
  unsave: (pinId: string) => {
    return del<void>(PIN_ENDPOINTS.unsave(pinId));
  },
};

export default savedPinApi;