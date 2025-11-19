/**
 * Pins API
 */

import { contentServiceClient } from './client'
import type {
  PinCreateRequest,
  CreatePinResponse,
  GetPinsParams,
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
    const params: any = { ...pageable }

    // Добавляем фильтры
    if (filter.q) params.q = filter.q
    if (filter.tags && filter.tags.size > 0) params.tags = Array.from(filter.tags).join(',')
    if (filter.authorId) params.authorId = filter.authorId
    if (filter.savedBy) params.savedBy = filter.savedBy
    if (filter.likedBy) params.likedBy = filter.likedBy
    if (filter.relatedTo) params.relatedTo = filter.relatedTo
    if (filter.createdFrom) params.createdFrom = filter.createdFrom
    if (filter.createdTo) params.createdTo = filter.createdTo
    if (filter.scope) params.scope = filter.scope

    const { data } = await contentServiceClient.get(BASE_PATH, { params })
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
