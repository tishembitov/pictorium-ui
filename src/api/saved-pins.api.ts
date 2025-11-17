/**
 * Saved Pins API
 */

import { contentServiceClient } from './client'
import type { SavePinResponse } from '@/types'

const BASE_PATH = '/api/v1/pins'

export const savedPinsApi = {
  /**
   * Сохранить пин
   */
  save: async (pinId: string): Promise<SavePinResponse> => {
    const { data } = await contentServiceClient.post(`${BASE_PATH}/${pinId}/saves`)
    return data
  },

  /**
   * Удалить пин из сохраненных
   */
  unsave: async (pinId: string): Promise<void> => {
    await contentServiceClient.delete(`${BASE_PATH}/${pinId}/saves`)
  },
}
