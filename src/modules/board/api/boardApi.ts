// src/modules/board/api/boardApi.ts

import { get, post, del, patch } from '@/shared/api/apiClient';
import { BOARD_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type { PagePinResponse } from '@/modules/pin';
import type { BoardResponse, BoardCreateRequest, BoardUpdateRequest } from '../types/board.types';

/**
 * Board API client
 */
export const boardApi = {
  /**
   * Create new board
   */
  create: (data: BoardCreateRequest) => {
    return post<BoardResponse, BoardCreateRequest>(BOARD_ENDPOINTS.create(), data);
  },

  /**
   * Get board by ID
   */
  getById: (boardId: string) => {
    return get<BoardResponse>(BOARD_ENDPOINTS.byId(boardId));
  },

  update: (boardId: string, data: BoardUpdateRequest) => {
    return patch<BoardResponse, BoardUpdateRequest>(BOARD_ENDPOINTS.byId(boardId), data);
  },

  /**
   * Delete board
   */
  delete: (boardId: string) => {
    return del<void>(BOARD_ENDPOINTS.delete(boardId));
  },

  /**
   * Get board pins
   */
  getPins: (boardId: string, pageable: Pageable = {}) => {
    return get<PagePinResponse>(BOARD_ENDPOINTS.pins(boardId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Add pin to board
   */
  addPin: (boardId: string, pinId: string) => {
    return post<void>(BOARD_ENDPOINTS.addPin(boardId, pinId));
  },

  /**
   * Remove pin from board
   */
  removePin: (boardId: string, pinId: string) => {
    return del<void>(BOARD_ENDPOINTS.removePin(boardId, pinId));
  },

  /**
   * Get current user's boards
   */
  getMyBoards: () => {
    return get<BoardResponse[]>(BOARD_ENDPOINTS.my());
  },

  /**
   * Get user's boards by userId
   */
  getUserBoards: (userId: string) => {
    return get<BoardResponse[]>(BOARD_ENDPOINTS.byUser(userId));
  },
};

export default boardApi;