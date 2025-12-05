// src/api/boards.api.ts
import { contentServiceClient } from './client'
import type {
  BoardCreateRequest,
  CreateBoardResponse,
  GetBoardResponse,
  GetBoardPinsResponse,
  GetUserBoardsResponse,
  GetMyBoardsResponse,
  GetSelectedBoardResponse,
  Pageable,
  Board,
} from '@/types'

const BASE_PATH = '/api/v1/boards'

export const boardsApi = {
  /**
   * Создать доску
   */
  create: async (boardData: BoardCreateRequest): Promise<CreateBoardResponse> => {
    const { data } = await contentServiceClient.post(BASE_PATH, boardData)
    return data
  },

  /**
   * Получить доску по ID
   */
  getById: async (boardId: string): Promise<GetBoardResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/${boardId}`)
    return data
  },

  /**
   * Получить пины доски
   */
  getBoardPins: async (boardId: string, pageable: Pageable): Promise<GetBoardPinsResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/${boardId}/pins`, {
      params: pageable,
    })
    return data
  },

  /**
   * Получить доски пользователя
   */
  getUserBoards: async (userId: string): Promise<GetUserBoardsResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/user/${userId}`)
    return data
  },

  /**
   * Получить мои доски
   */
  getMyBoards: async (): Promise<GetMyBoardsResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/me`)
    return data
  },

  /**
   * Получить выбранную доску
   */
  getSelectedBoard: async (): Promise<GetSelectedBoardResponse> => {
    const { data } = await contentServiceClient.get(`${BASE_PATH}/selected`)
    return data
  },

  /**
   * Выбрать доску
   */
  selectBoard: async (boardId: string): Promise<void> => {
    await contentServiceClient.patch(`${BASE_PATH}/${boardId}/select`)
  },

  /**
   * Отменить выбор доски
   */
  deselectBoard: async (): Promise<void> => {
    await contentServiceClient.delete(`${BASE_PATH}/selected`)
  },

  /**
   * Обновить доску
   * NOTE: В OpenAPI спецификации нет endpoint для обновления доски,
   * но оставляем для обратной совместимости
   */
  update: async (boardId: string, data: { title: string }): Promise<Board> => {
    const { data: response } = await contentServiceClient.patch(`${BASE_PATH}/${boardId}`, data)
    return response
  },

  /**
   * Удалить доску
   */
  delete: async (boardId: string): Promise<void> => {
    await contentServiceClient.delete(`${BASE_PATH}/${boardId}`)
  },

  /**
   * Добавить пин в доску
   */
  addPin: async (boardId: string, pinId: string): Promise<void> => {
    await contentServiceClient.post(`${BASE_PATH}/${boardId}/pins/${pinId}`)
  },

  /**
   * Удалить пин из доски
   */
  removePin: async (boardId: string, pinId: string): Promise<void> => {
    await contentServiceClient.delete(`${BASE_PATH}/${boardId}/pins/${pinId}`)
  },
}

export const selectedBoardApi = {
  getSelectedBoard: boardsApi.getSelectedBoard,
  selectBoard: boardsApi.selectBoard,
  deselectBoard: boardsApi.deselectBoard,
} as const
