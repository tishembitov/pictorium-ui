// src/modules/board/api/selectedBoardApi.ts

import { get, patch, del } from '@/shared/api/apiClient';
import { BOARD_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { BoardResponse } from '../types/board.types';

/**
 * Selected Board API client
 */
export const selectedBoardApi = {
  /**
   * Get currently selected board
   */
  getSelected: () => {
    return get<BoardResponse>(BOARD_ENDPOINTS.selected());
  },

  /**
   * Select a board
   */
  select: (boardId: string) => {
    return patch<void>(BOARD_ENDPOINTS.select(boardId));
  },

  /**
   * Deselect current board
   */
  deselect: () => {
    return del<void>(BOARD_ENDPOINTS.deselect());
  },
};

export default selectedBoardApi;