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

export interface BoardSaveInfo {
  boardId: string;
  boardName: string;
  count: number;
}

export interface UseBoardSaveManagerProps {
  pinId: string;
  lastSavedBoardId: string | null;
  lastSavedBoardName: string | null;
  savedToBoardsCount: number;
}

export interface UseBoardSaveManagerResult {
  // State
  isDropdownOpen: boolean;
  showCreateModal: boolean;
  searchQuery: string;
  savingToBoardId: string | null;
  removingFromBoardId: string | null;
  anchorElement: HTMLDivElement | null;

  // Data
  boards: BoardWithPinStatusResponse[];
  filteredBoards: BoardWithPinStatusResponse[];
  isBoardsLoading: boolean;

  // Computed
  isSaved: boolean;
  currentSaveInfo: BoardSaveInfo | null;
  displayBoardName: string;
  currentCount: number;
  savedBoardsCount: number;
  isLoading: boolean;

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
  handleCreateSuccess: (boardId: string) => void;
  closeCreateModal: () => void;
}

export const useBoardSaveManager = ({
  pinId,
  lastSavedBoardId,
  lastSavedBoardName,
  savedToBoardsCount,
}: UseBoardSaveManagerProps): UseBoardSaveManagerResult => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  // UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingToBoardId, setSavingToBoardId] = useState<string | null>(null);
  const [removingFromBoardId, setRemovingFromBoardId] = useState<string | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

  // Local save state for immediate UI updates
  const [localSaveInfo, setLocalSaveInfo] = useState<BoardSaveInfo | null>(null);

  // Store
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const { selectBoard } = useSelectBoard();

  // Boards data
  const {
    boards,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated && isDropdownOpen });

  // Mutations
  const { savePinToBoard, isLoading: isSavingToBoard } = useSavePinToBoard({
    showToast: false,
    onSuccess: (boardId, boardName) => {
      setLocalSaveInfo({
        boardId,
        boardName,
        count: (localSaveInfo?.count ?? savedToBoardsCount) + 1,
      });
      setSavingToBoardId(null);
      void refetchBoards();
      toast.success(`Saved to "${boardName}"`);
    },
  });

  const { removePinFromBoard } = useRemovePinFromBoard({
    showToast: false,
    onSuccess: () => {
      setRemovingFromBoardId(null);
      const newCount = (localSaveInfo?.count ?? savedToBoardsCount) - 1;
      if (newCount <= 0) {
        setLocalSaveInfo(null);
      } else {
        const remainingSaved = boards.filter(
          (b) => b.hasPin && b.id !== removingFromBoardId
        );
        if (remainingSaved.length > 0 && remainingSaved[0]) {
          setLocalSaveInfo({
            boardId: remainingSaved[0].id,
            boardName: remainingSaved[0].title,
            count: newCount,
          });
        }
      }
      void refetchBoards();
      toast.success('Removed from board');
    },
    onError: () => {
      setRemovingFromBoardId(null);
    },
  });

  // Computed values
  const isSaved = useMemo(() => {
    return localSaveInfo !== null || savedToBoardsCount > 0;
  }, [localSaveInfo, savedToBoardsCount]);

  const currentSaveInfo = useMemo((): BoardSaveInfo | null => {
    if (localSaveInfo) return localSaveInfo;
    if (lastSavedBoardId && lastSavedBoardName) {
      return {
        boardId: lastSavedBoardId,
        boardName: lastSavedBoardName,
        count: savedToBoardsCount,
      };
    }
    return null;
  }, [localSaveInfo, lastSavedBoardId, lastSavedBoardName, savedToBoardsCount]);

  const displayBoardName = useMemo(() => {
    if (currentSaveInfo) return currentSaveInfo.boardName;
    if (selectedBoard) return selectedBoard.title;
    return 'Select board';
  }, [currentSaveInfo, selectedBoard]);

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter((b) => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const currentCount = localSaveInfo?.count ?? savedToBoardsCount;
  const savedBoardsCount = boards.filter((b) => b.hasPin).length;
  const isLoading = isSavingToBoard || savingToBoardId !== null;

  // Handlers
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

    if (isSaved) {
      setIsDropdownOpen(true);
      return;
    }

    if (!selectedBoard) {
      setIsDropdownOpen(true);
      return;
    }

    const alreadySaved = boards.find((b) => b.id === selectedBoard.id)?.hasPin;
    if (alreadySaved) {
      setIsDropdownOpen(true);
      return;
    }

    setSavingToBoardId(selectedBoard.id);
    savePinToBoard({ boardId: selectedBoard.id, pinId });
  }, [isAuthenticated, login, isSaved, selectedBoard, boards, savePinToBoard, pinId]);

  const handleSaveToBoard = useCallback(
    (board: BoardWithPinStatusResponse) => {
      if (board.hasPin) return;

      setSavingToBoardId(board.id);
      savePinToBoard({ boardId: board.id, pinId });
      selectBoard(board.id);
    },
    [savePinToBoard, pinId, selectBoard]
  );

  // ✅ Без confirm - сразу удаляем
  const handleRemoveFromBoard = useCallback(
    (board: BoardWithPinStatusResponse) => {
      setRemovingFromBoardId(board.id);
      removePinFromBoard({ boardId: board.id, pinId });
    },
    [removePinFromBoard, pinId]
  );

  const handleCreateNew = useCallback(() => {
    setIsDropdownOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback(
    (boardId: string) => {
      const newBoard = boards.find((b) => b.id === boardId);
      setLocalSaveInfo({
        boardId,
        boardName: newBoard?.title || 'New Board',
        count: (localSaveInfo?.count ?? savedToBoardsCount) + 1,
      });
      selectBoard(boardId);
      setShowCreateModal(false);
      void refetchBoards();
    },
    [boards, selectBoard, refetchBoards, localSaveInfo, savedToBoardsCount]
  );

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  return {
    // State
    isDropdownOpen,
    showCreateModal,
    searchQuery,
    savingToBoardId,
    removingFromBoardId,
    anchorElement,

    // Data
    boards,
    filteredBoards,
    isBoardsLoading,

    // Computed
    isSaved,
    currentSaveInfo,
    displayBoardName,
    currentCount,
    savedBoardsCount,
    isLoading,

    // Auth
    isAuthenticated,

    // Handlers
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