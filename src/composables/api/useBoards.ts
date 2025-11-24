/**
 * useBoards Composable (Refactored)
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useBoardsStore } from '@/stores/boards.store'
import { useSelectedBoardStore } from '@/stores/selectedBoard.store'
import { useApiCall } from '@/composables/core/useApiCall'
import type { Board, Pin } from '@/types'

/**
 * useBoards - Работа с досками
 */
export function useBoards() {
  const boardsStore = useBoardsStore()

  const { myBoards, currentBoard, currentBoardPins, isLoading, isLoadingPins, hasBoardPinsMore } =
    storeToRefs(boardsStore)

  // Fetch My Boards
  const { execute: fetchMyBoards } = useApiCall(() => boardsStore.fetchMyBoards(), {
    showErrorToast: true,
    errorMessage: 'Failed to load boards',
  })

  // Fetch User Boards
  const { execute: fetchUserBoards } = useApiCall(
    (userId: string, forceReload = false) => boardsStore.fetchUserBoards(userId, forceReload),
    { showErrorToast: true, errorMessage: 'Failed to load user boards' },
  )

  // Fetch Board by ID
  const { execute: fetchBoardById } = useApiCall(
    (boardId: string, page = 0, size = 15) => boardsStore.fetchBoardById(boardId, page, size),
    { showErrorToast: true, errorMessage: 'Failed to load board' },
  )

  // Load More Board Pins
  const { execute: loadMoreBoardPins } = useApiCall(() => boardsStore.loadMoreBoardPins(), {
    showErrorToast: true,
    errorMessage: 'Failed to load more pins',
  })

  // Create Board
  const { execute: createBoard } = useApiCall((title: string) => boardsStore.createBoard(title), {
    showSuccessToast: true,
    successMessage: 'Board created!',
    showErrorToast: true,
  })

  // Delete Board
  const { execute: deleteBoard } = useApiCall(
    (boardId: string) => boardsStore.deleteBoard(boardId),
    { showSuccessToast: true, successMessage: 'Board deleted!', showErrorToast: true },
  )

  // Add Pin to Board
  const { execute: addPinToBoard } = useApiCall(
    (boardId: string, pinId: string) => boardsStore.addPinToBoard(boardId, pinId),
    { showSuccessToast: true, successMessage: 'Pin added to board!', showErrorToast: true },
  )

  // Remove Pin from Board
  const { execute: removePinFromBoard } = useApiCall(
    (boardId: string, pinId: string) => boardsStore.removePinFromBoard(boardId, pinId),
    { showSuccessToast: true, successMessage: 'Pin removed from board!', showErrorToast: true },
  )

  const clearCurrentBoard = () => boardsStore.clearCurrentBoard()
  const getBoardById = (boardId: string) => boardsStore.getBoardById(boardId)

  return {
    // State
    myBoards: computed(() => myBoards.value),
    currentBoard: computed(() => currentBoard.value),
    currentBoardPins: computed(() => currentBoardPins.value),
    isLoading: computed(() => isLoading.value),
    isLoadingPins: computed(() => isLoadingPins.value),
    hasBoardPinsMore: computed(() => hasBoardPinsMore.value),

    // Actions
    fetchMyBoards: async () => (await fetchMyBoards()) || [],
    fetchUserBoards: async (userId: string, forceReload = false) =>
      (await fetchUserBoards(userId, forceReload)) || [],
    fetchBoardById: async (boardId: string, page = 0, size = 15) =>
      (await fetchBoardById(boardId, page, size)) || [],
    loadMoreBoardPins: async () => {
      await loadMoreBoardPins()
    },
    createBoard: async (title: string) => (await createBoard(title))!,
    deleteBoard: async (boardId: string) => {
      await deleteBoard(boardId)
    },
    addPinToBoard: async (boardId: string, pinId: string) => {
      await addPinToBoard(boardId, pinId)
    },
    removePinFromBoard: async (boardId: string, pinId: string) => {
      await removePinFromBoard(boardId, pinId)
    },
    clearCurrentBoard,
    getBoardById,
  }
}

/**
 * useSelectedBoard - Работа с выбранной доской
 */
export function useSelectedBoard() {
  const selectedBoardStore = useSelectedBoardStore()

  const { selectedBoard, hasSelectedBoard, selectedBoardId, selectedBoardTitle, isLoading } =
    storeToRefs(selectedBoardStore)

  const { execute: fetchSelectedBoard } = useApiCall(
    () => selectedBoardStore.fetchSelectedBoard(),
    { showErrorToast: false }, // Не показываем ошибку, если доска не выбрана
  )

  const { execute: selectBoard } = useApiCall(
    (boardId: string) => selectedBoardStore.selectBoard(boardId),
    { showSuccessToast: true, successMessage: 'Board selected!', showErrorToast: true },
  )

  const { execute: deselectBoard } = useApiCall(() => selectedBoardStore.deselectBoard(), {
    showSuccessToast: true,
    successMessage: 'Board deselected!',
    showErrorToast: true,
  })

  const { execute: setBoard } = useApiCall(
    (board: Board | null) => selectedBoardStore.setBoard(board),
    { showErrorToast: true },
  )

  return {
    selectedBoard,
    hasSelectedBoard,
    selectedBoardId,
    selectedBoardTitle,
    isLoading,
    fetchSelectedBoard: async () => await fetchSelectedBoard(),
    selectBoard: async (boardId: string) => {
      await selectBoard(boardId)
    },
    deselectBoard: async () => {
      await deselectBoard()
    },
    setBoard: async (board: Board | null) => {
      await setBoard(board)
    },
  }
}

/**
 * useBoardDetail - Для страницы доски
 */
export function useBoardDetail(boardId: string | (() => string)) {
  const { fetchBoardById, currentBoard, currentBoardPins, isLoadingPins } = useBoards()

  const getId = () => (typeof boardId === 'string' ? boardId : boardId())

  const fetchBoard = async (page = 0, size = 15) => {
    await fetchBoardById(getId(), page, size)
  }

  return {
    board: currentBoard,
    pins: currentBoardPins,
    isLoading: isLoadingPins,
    fetchBoard,
  }
}
