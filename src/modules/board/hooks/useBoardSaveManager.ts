// src/modules/board/hooks/useBoardSaveManager.ts

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/shared/hooks/useToast';
import { useMyBoardsForPin } from './useMyBoardsForPin';
import { useSavePinToBoard } from './useSavePinToBoard';
import { useRemovePinFromBoard } from './useRemovePinFromBoard';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import { useSelectBoard } from './useSelectBoard';
import type { BoardWithPinStatusResponse } from '../types/board.types';
import type { PinLocalState, SavedBoardInfo } from '@/modules/pin';

export interface UseBoardSaveManagerProps {
  pinId: string;
  localState: PinLocalState;
  onSave: (board: SavedBoardInfo) => void;
  onRemove: (boardId: string, remainingBoards?: SavedBoardInfo[]) => void;
}

export interface UseBoardSaveManagerResult {
  // UI State
  isDropdownOpen: boolean;
  showCreateModal: boolean;
  searchQuery: string;
  anchorElement: HTMLDivElement | null;

  // Loading states
  savingToBoardId: string | null;
  removingFromBoardId: string | null;

  // Data
  boards: BoardWithPinStatusResponse[];
  filteredBoards: BoardWithPinStatusResponse[];
  isBoardsLoading: boolean;

  // Computed
  displayBoardName: string;
  savedBoardsCount: number;

  // Auth
  isAuthenticated: boolean;

  // Handlers
  setAnchorRef: (node: HTMLDivElement | null) => void;
  setSearchQuery: (query: string) => void;
  handleDropdownToggle: () => void;
  handleDropdownDismiss: () => void;
  handleQuickSave: () => void;
  handleSaveToBoard: (board: BoardWithPinStatusResponse) => void;
  handleRemoveFromBoard: (board: BoardWithPinStatusResponse) => void;
  handleCreateNew: () => void;
  handleCreateSuccess: (boardId: string, boardName?: string) => void;
  closeCreateModal: () => void;
}

export const useBoardSaveManager = ({
  pinId,
  localState,
  onSave,
  onRemove,
}: UseBoardSaveManagerProps): UseBoardSaveManagerResult => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  // ============ UI State ============
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  const [savingToBoardId, setSavingToBoardId] = useState<string | null>(null);
  const [removingFromBoardId, setRemovingFromBoardId] = useState<string | null>(null);

  // ============ Store ============
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const { selectBoard } = useSelectBoard();

  // ============ Server Data ============
  const {
    boards,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { 
    enabled: isAuthenticated && isDropdownOpen,
  });

  // ============ Mutations ============
  const { savePinToBoard } = useSavePinToBoard({
    onSuccess: () => {
      setSavingToBoardId(null);
      void refetchBoards();
    },
    onError: (error) => {
      setSavingToBoardId(null);
      toast.error(error.message || 'Failed to save pin'); // Можно поменять на пресет, если потребуется
    },
  });

  const { removePinFromBoard } = useRemovePinFromBoard({
    onSuccess: () => {
      setRemovingFromBoardId(null);
      void refetchBoards();
    },
    onError: (error) => {
      setRemovingFromBoardId(null);
      toast.error(error.message || 'Failed to remove pin'); // Можно поменять на пресет, если потребуется
    },
  });

  // ============ Computed ============
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter((b) => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const displayBoardName = useMemo(() => {
    if (localState.lastSavedBoardName) return localState.lastSavedBoardName;
    if (selectedBoard) return selectedBoard.title;
    return 'Select board';
  }, [localState.lastSavedBoardName, selectedBoard]);

  const savedBoardsCount = boards.filter((b) => b.hasPin).length;

  // ============ Handlers ============
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  const handleDropdownToggle = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsDropdownOpen((prev) => !prev);
  }, [isAuthenticated, login]);

  const handleDropdownDismiss = useCallback(() => {
    setIsDropdownOpen(false);
    setSearchQuery('');
  }, []);

  const handleQuickSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (localState.isSaved) {
      setIsDropdownOpen(true);
      return;
    }

    if (!selectedBoard) {
      setIsDropdownOpen(true);
      return;
    }

    // 1. Immediate UI update via callback
    onSave({
      boardId: selectedBoard.id,
      boardName: selectedBoard.title,
    });
    toast.pin.saved(selectedBoard.title);

    // 2. Background mutation
    setSavingToBoardId(selectedBoard.id);
    savePinToBoard({ boardId: selectedBoard.id, pinId });
  }, [isAuthenticated, login, localState.isSaved, selectedBoard, onSave, savePinToBoard, pinId, toast]);

  const handleSaveToBoard = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;

    // 1. Immediate UI update
    onSave({
      boardId: board.id,
      boardName: board.title,
    });
    toast.pin.saved(board.title);

    // 2. Update selected board
    selectBoard(board.id);

    // 3. Background mutation
    setSavingToBoardId(board.id);
    savePinToBoard({ boardId: board.id, pinId });
  }, [onSave, selectBoard, savePinToBoard, pinId, toast]);

  const handleRemoveFromBoard = useCallback((board: BoardWithPinStatusResponse) => {
    const remainingBoards = boards
      .filter((b) => b.hasPin && b.id !== board.id)
      .map((b) => ({ boardId: b.id, boardName: b.title }));

    // 1. Immediate UI update
    onRemove(board.id, remainingBoards);
    toast.pin.removed(board.title);

    // 2. Background mutation
    setRemovingFromBoardId(board.id);
    removePinFromBoard({ boardId: board.id, pinId });
  }, [boards, onRemove, removePinFromBoard, pinId, toast]);

  const handleCreateNew = useCallback(() => {
    setIsDropdownOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string, boardName?: string) => {
    // Board was created with pin already saved
    onSave({ 
      boardId, 
      boardName: boardName || 'New Board',
    });
    selectBoard(boardId);
    setShowCreateModal(false);
    void refetchBoards();
  }, [onSave, selectBoard, refetchBoards]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  return {
    isDropdownOpen,
    showCreateModal,
    searchQuery,
    anchorElement,
    savingToBoardId,
    removingFromBoardId,
    boards,
    filteredBoards,
    isBoardsLoading,
    displayBoardName,
    savedBoardsCount,
    isAuthenticated,
    setAnchorRef,
    setSearchQuery,
    handleDropdownToggle,
    handleDropdownDismiss,
    handleQuickSave,
    handleSaveToBoard,
    handleRemoveFromBoard,
    handleCreateNew,
    handleCreateSuccess,
    closeCreateModal,
  };
};

export default useBoardSaveManager;