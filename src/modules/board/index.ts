// src/modules/board/index.ts

// Types
export type {
    BoardResponse,
    BoardCreateRequest,
    PageBoardResponse,
    BoardWithState,
    BoardFormValues,
    BoardPinAction,
  } from './types/board.types';
  
  // API
  export { boardApi } from './api/boardApi';
  export { selectedBoardApi } from './api/selectedBoardApi';
  
  // Hooks
  export { useBoard } from './hooks/useBoard';
  export { useMyBoards } from './hooks/useMyBoards';
  export { useUserBoards } from './hooks/useUserBoards';
  export { useBoardPins, useInfiniteBoardPins } from './hooks/useBoardPins';
  export { useCreateBoard } from './hooks/useCreateBoard';
  export { useDeleteBoard } from './hooks/useDeleteBoard';
  export { useAddPinToBoard } from './hooks/useAddPinToBoard';
  export { useRemovePinFromBoard } from './hooks/useRemovePinFromBoard';
  export { useSelectedBoard } from './hooks/useSelectedBoard';
  export { useSelectBoard } from './hooks/useSelectBoard';
  
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
  export { boardCreateSchema, type BoardCreateFormData } from './components/boardCreateSchema';
  export { BoardSelector } from './components/BoardSelector';
  export { BoardPicker } from './components/BoardPicker';