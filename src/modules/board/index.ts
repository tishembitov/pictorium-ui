// src/modules/board/index.ts

// Types
export type {
  BoardResponse,
  BoardCreateRequest,
  BoardUpdateRequest,
  PageBoardResponse,
  BoardWithState,
  BoardFormValues,
  BoardPinAction,
  BoardWithPinStatusResponse,
  SavePinToBoardsRequest,
  BatchBoardPinAction,
} from './types/board.types';

// API
export { boardApi } from './api/boardApi';
export { selectedBoardApi } from './api/selectedBoardApi';

// Hooks
export { useBoard } from './hooks/useBoard';
export { useMyBoards } from './hooks/useMyBoards';
export { useMyBoardsForPin } from './hooks/useMyBoardsForPin';
export { useUserBoards } from './hooks/useUserBoards';
export { useBoardPins, useInfiniteBoardPins } from './hooks/useBoardPins';
export { useCreateBoardWithPin } from './hooks/useCreateBoardWithPin';
export { useCreateBoard } from './hooks/useCreateBoard';
export { useUpdateBoard } from './hooks/useUpdateBoard';
export { useDeleteBoard } from './hooks/useDeleteBoard';
export { useSavePinToBoard } from './hooks/useSavePinToBoard';
export { useRemovePinFromBoard } from './hooks/useRemovePinFromBoard';
export { useSavePinToBoards } from './hooks/useSavePinToBoards';
export { useSelectedBoard } from './hooks/useSelectedBoard';
export { useSelectBoard } from './hooks/useSelectBoard';
export { useBoardSaveManager } from './hooks/useBoardSaveManager';
export type { BoardSaveInfo, UseBoardSaveManagerResult } from './hooks/useBoardSaveManager';

// Store
export {
  useSelectedBoardStore,
  selectSelectedBoard,
  selectHasSelectedBoard,
} from './stores/selectedBoardStore';

// Components
export { BoardCard } from './components/BoardCard';
export { BoardGrid } from './components/BoardGrid';
export { BoardDetail } from './components/BoardDetail';
export { BoardHeader } from './components/BoardHeader';
export { BoardCreateModal } from './components/BoardCreateModal';
export { BoardEditModal } from './components/BoardEditModal';
export { boardCreateSchema, type BoardCreateFormData } from './components/boardCreateSchema';
export { BoardSelector } from './components/BoardSelector';
export { BoardPreviewImage } from './components/BoardPreviewImage';
export { BoardListItem } from './components/BoardListItem';
export { BoardSaveDropdown } from './components/BoardSaveDropdown';
export { BoardPickerItem } from './components/BoardPickerItem';
export { BoardPickerDropdown } from './components/BoardPickerDropdown';