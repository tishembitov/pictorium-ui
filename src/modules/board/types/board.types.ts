// src/modules/board/types/board.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';

/**
 * Board create request
 */
export interface BoardCreateRequest {
  title: string; // required, maxLength: 200
}

/**
 * Board response from API
 */
export interface BoardResponse {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated boards response
 */
export type PageBoardResponse = PageResponse<BoardResponse>;

/**
 * Board with additional UI state
 */
export interface BoardWithState extends BoardResponse {
  isSelected?: boolean;
  pinCount?: number;
  coverImageId?: string | null;
}

/**
 * Board form values
 */
export interface BoardFormValues {
  title: string;
}

/**
 * Board pin action
 */
export interface BoardPinAction {
  boardId: string;
  pinId: string;
}