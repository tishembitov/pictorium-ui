/**
 * Pins API
 */

import { contentServiceClient } from './client'
import type {
  PinCreateRequest,
  CreatePinResponse,
  GetPinsResponse,
  GetPinByIdResponse,
  PinUpdateRequest,
  UpdatePinResponse,
  Pageable,
  PinFilter,
} from '@/types'

const BASE_PATH = '/api/v1/pins'

export const pinsApi = {
  /**
   * Создать пин
   */
  create: async (pinData: PinCreateRequest): Promise<CreatePinResponse> => {
    const { data } = await contentServiceClient.post(BASE_PATH, pinData)
    return data
  },

  /**
   * Получить список пинов с фильтрацией и пагинацией
   */
  getPins: async (filter: PinFilter, pageable: Pageable): Promise<GetPinsResponse> => {
    const { data } = await contentServiceClient.get(BASE_PATH, {
      params: {
        filter: JSON.stringify(filter),
        pageable: JSON.stringify(pageable),
      },
    })
    return data
  },

  /**
   * Получить пин по ID
   */
  getById: async (pinId: string): Promise<GetPinByIdResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/${pinId}`)
    return data
  },

  /**
   * Обновить пин
   */
  update: async (pinId: string, pinData: PinUpdateRequest): Promise<UpdatePinResponse> => {
    const { data } = await contentServiceClient.patch(`${BASE_PATH}/${pinId}`, pinData)
    return data
  },

  /**
   * Удалить пин
   */
  delete: async (pinId: string): Promise<void> => {
    await contentServiceClient.delete(`${BASE_PATH}/${pinId}`)
  },
}
