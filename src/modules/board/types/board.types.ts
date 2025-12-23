// src/modules/board/types/board.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';

/**
 * Board create request
 */
export interface BoardCreateRequest {
  title: string; // required, maxLength: 200
}

export interface BoardUpdateRequest {
  title?: string;
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
 * Board with pin status - для отображения при сохранении пина
 */
export interface BoardWithPinStatusResponse extends BoardResponse {
  hasPin: boolean;   // true если пин уже в этой доске
  pinCount: number;  // количество пинов в доске
}

/**
 * Request to save pin to multiple boards
 */
export interface SavePinToBoardsRequest {
  boardIds: string[]; // minItems: 1
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
 * Board pin action - для одиночных операций
 */
export interface BoardPinAction {
  boardId: string;
  pinId: string;
}

/**
 * Batch board pin action - для множественных операций
 */
export interface BatchBoardPinAction {
  pinId: string;
  boardIds: string[];
}