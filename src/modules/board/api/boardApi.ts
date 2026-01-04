// src/modules/board/api/boardApi.ts

import { get, post, del, patch } from '@/shared/api/apiClient';
import { BOARD_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type { PagePinResponse, PinResponse } from '@/modules/pin';
import type { 
  BoardResponse, 
  BoardCreateRequest, 
  BoardUpdateRequest,
  BoardWithPinStatusResponse,
  SavePinToBoardsRequest,
} from '../types/board.types';

/**
 * Board API client
 */
export const boardApi = {
  // ==================== Board CRUD ====================
  
  /**
   * Create new board
   */
  create: (data: BoardCreateRequest) => {
    return post<BoardResponse, BoardCreateRequest>(BOARD_ENDPOINTS.create(), data);
  },

  /**
   * ✅ NEW: Create board and save pin in one request
   * POST /api/v1/boards/with-pin/{pinId}
   */
  createWithPin: (pinId: string, data: BoardCreateRequest) => {
    return post<BoardResponse, BoardCreateRequest>(BOARD_ENDPOINTS.createWithPin(pinId), data);
  },

  /**
   * Get board by ID
   */
  getById: (boardId: string) => {
    return get<BoardResponse>(BOARD_ENDPOINTS.byId(boardId));
  },

  /**
   * Update board
   */
  update: (boardId: string, data: BoardUpdateRequest) => {
    return patch<BoardResponse, BoardUpdateRequest>(BOARD_ENDPOINTS.byId(boardId), data);
  },

  /**
   * Delete board
   */
  delete: (boardId: string) => {
    return del<void>(BOARD_ENDPOINTS.delete(boardId));
  },

  // ==================== Board Queries ====================

  /**
   * Get board pins
   */
  getPins: (boardId: string, pageable: Pageable = {}) => {
    return get<PagePinResponse>(BOARD_ENDPOINTS.pins(boardId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Get current user's boards
   */
  getMyBoards: () => {
    return get<BoardResponse[]>(BOARD_ENDPOINTS.my());
  },

  /**
   * Get current user's boards with pin status
   * Показывает, в каких досках уже есть указанный пин
   * GET /api/v1/boards/me/for-pin/{pinId}
   */
  getMyBoardsForPin: (pinId: string) => {
    return get<BoardWithPinStatusResponse[]>(BOARD_ENDPOINTS.myForPin(pinId));
  },

  /**
   * Get user's boards by userId
   */
  getUserBoards: (userId: string) => {
    return get<BoardResponse[]>(BOARD_ENDPOINTS.byUser(userId));
  },

  // ==================== Pin-Board Operations ====================

  /**
   * Save pin to a single board
   * POST /api/v1/boards/{boardId}/pins/{pinId}
   * ✅ Returns PinResponse with updated savedToBoardsCount
   */
  savePinToBoard: (boardId: string, pinId: string) => {
    return post<PinResponse>(BOARD_ENDPOINTS.addPin(boardId, pinId));
  },

  /**
   * Remove pin from a single board
   * DELETE /api/v1/boards/{boardId}/pins/{pinId}
   */
  removePinFromBoard: (boardId: string, pinId: string) => {
    return del<void>(BOARD_ENDPOINTS.removePin(boardId, pinId));
  },

  /**
   * Save pin to multiple boards at once
   * POST /api/v1/boards/pins/{pinId}
   * ✅ Returns PinResponse with updated savedToBoardsCount
   */
  savePinToBoards: (pinId: string, boardIds: string[]) => {
    return post<PinResponse, SavePinToBoardsRequest>(
      BOARD_ENDPOINTS.savePinToBoards(pinId), 
      { boardIds }
    );
  },
};

export default boardApi;