/**
 * Tags API
 */

import { contentServiceClient } from './client'
import type {
  GetAllTagsParams,
  GetAllTagsResponse,
  GetTagByIdResponse,
  SearchTagsParams,
  SearchTagsResponse,
  GetPinTagsResponse,
  GetCategoriesParams,
  GetCategoriesResponse,
} from '@/types'

const BASE_PATH = '/api/v1/tags'

export const tagsApi = {
  /**
   * Получить все теги с пагинацией
   */
  getAll: async (params: GetAllTagsParams): Promise<GetAllTagsResponse> => {
    const { data } = await contentServiceClient.get(BASE_PATH, {
      params: {
        pageable: JSON.stringify(params.pageable),
      },
    })
    return data
  },

  /**
   * Получить тег по ID
   */
  getById: async (tagId: string): Promise<GetTagByIdResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/${tagId}`)
    return data
  },

  /**
   * Поиск тегов
   */
  search: async (params: SearchTagsParams): Promise<SearchTagsResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/search`, {
      params,
    })
    return data
  },

  /**
   * Получить теги пина
   */
  getPinTags: async (pinId: string): Promise<GetPinTagsResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/pins/${pinId}`)
    return data
  },

  /**
   * Получить категории (теги с превью)
   */
  getCategories: async (params: GetCategoriesParams = {}): Promise<GetCategoriesResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/categories`, {
      params,
    })
    return data
  },
}
