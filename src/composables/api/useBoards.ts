/**
 * useBoards Composable
 *
 * Composable для работы с досками
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBoardsStore } from '@/stores/boards.store'
import { useSelectedBoardStore } from '@/stores/selectedBoard.store'
import type { Board, Pin } from '@/types'
import { useToast } from '@/composables/ui/useToast'

export interface UseBoardsReturn {
  // State
  myBoards: ComputedRef<Board[]>
  currentBoard: ComputedRef<Board | null>
  currentBoardPins: ComputedRef<Pin[]>
  isLoading: ComputedRef<boolean>
  isLoadingPins: ComputedRef<boolean>
  hasBoardPinsMore: ComputedRef<boolean>

  // Actions
  fetchMyBoards: () => Promise<Board[]>
  fetchUserBoards: (userId: string, forceReload?: boolean) => Promise<Board[]>
  fetchBoardById: (boardId: string, page?: number, size?: number) => Promise<Pin[]>
  loadMoreBoardPins: () => Promise<void>
  createBoard: (title: string) => Promise<Board>
  deleteBoard: (boardId: string) => Promise<void>
  addPinToBoard: (boardId: string, pinId: string) => Promise<void>
  removePinFromBoard: (boardId: string, pinId: string) => Promise<void>
  clearCurrentBoard: () => void
  getBoardById: (boardId: string) => Board | undefined
}

/**
 * useBoards
 *
 * @example
 * ```ts
 * const {
 *   myBoards,
 *   fetchMyBoards,
 *   createBoard,
 *   addPinToBoard
 * } = useBoards()
 *
 * // Загрузка досок
 * await fetchMyBoards()
 *
 * // Создание доски
 * const board = await createBoard('My Board')
 *
 * // Добавление пина на доску
 * await addPinToBoard(board.id, pinId)
 * ```
 */
export function useBoards(): UseBoardsReturn {
  const boardsStore = useBoardsStore()
  const { showToast } = useToast()

  // State
  const { myBoards, currentBoard, currentBoardPins, isLoading, isLoadingPins, hasBoardPinsMore } =
    storeToRefs(boardsStore)

  // Actions
  const fetchMyBoards = async (): Promise<Board[]> => {
    try {
      return await boardsStore.fetchMyBoards()
    } catch (error) {
      console.error('[useBoards] Fetch my boards failed:', error)
      showToast('Failed to load boards', 'error')
      throw error
    }
  }

  const fetchUserBoards = async (userId: string, forceReload = false): Promise<Board[]> => {
    try {
      return await boardsStore.fetchUserBoards(userId, forceReload)
    } catch (error) {
      console.error('[useBoards] Fetch user boards failed:', error)
      showToast('Failed to load user boards', 'error')
      throw error
    }
  }

  const fetchBoardById = async (boardId: string, page = 0, size = 15): Promise<Pin[]> => {
    try {
      return await boardsStore.fetchBoardById(boardId, page, size)
    } catch (error) {
      console.error('[useBoards] Fetch board by ID failed:', error)
      showToast('Failed to load board', 'error')
      throw error
    }
  }

  const loadMoreBoardPins = async (): Promise<void> => {
    try {
      await boardsStore.loadMoreBoardPins()
    } catch (error) {
      console.error('[useBoards] Load more board pins failed:', error)
      showToast('Failed to load more pins', 'error')
      throw error
    }
  }

  const createBoard = async (title: string): Promise<Board> => {
    try {
      const board = await boardsStore.createBoard(title)
      showToast('Board created successfully!', 'success')
      return board
    } catch (error) {
      console.error('[useBoards] Create board failed:', error)
      showToast('Failed to create board', 'error')
      throw error
    }
  }

  const deleteBoard = async (boardId: string): Promise<void> => {
    try {
      await boardsStore.deleteBoard(boardId)
      showToast('Board deleted successfully!', 'success')
    } catch (error) {
      console.error('[useBoards] Delete board failed:', error)
      showToast('Failed to delete board', 'error')
      throw error
    }
  }

  const addPinToBoard = async (boardId: string, pinId: string): Promise<void> => {
    try {
      await boardsStore.addPinToBoard(boardId, pinId)
      showToast('Pin added to board!', 'success')
    } catch (error) {
      console.error('[useBoards] Add pin to board failed:', error)
      showToast('Failed to add pin to board', 'error')
      throw error
    }
  }

  const removePinFromBoard = async (boardId: string, pinId: string): Promise<void> => {
    try {
      await boardsStore.removePinFromBoard(boardId, pinId)
      showToast('Pin removed from board!', 'success')
    } catch (error) {
      console.error('[useBoards] Remove pin from board failed:', error)
      showToast('Failed to remove pin from board', 'error')
      throw error
    }
  }

  const clearCurrentBoard = (): void => {
    boardsStore.clearCurrentBoard()
  }

  const getBoardById = (boardId: string): Board | undefined => {
    return boardsStore.getBoardById(boardId)
  }

  return {
    // State
    myBoards: computed(() => myBoards.value),
    currentBoard: computed(() => currentBoard.value),
    currentBoardPins: computed(() => currentBoardPins.value),
    isLoading: computed(() => isLoading.value),
    isLoadingPins: computed(() => isLoadingPins.value),
    hasBoardPinsMore: computed(() => hasBoardPinsMore.value),

    // Actions
    fetchMyBoards,
    fetchUserBoards,
    fetchBoardById,
    loadMoreBoardPins,
    createBoard,
    deleteBoard,
    addPinToBoard,
    removePinFromBoard,
    clearCurrentBoard,
    getBoardById,
  }
}

/**
 * useSelectedBoard
 *
 * Работа с выбранной доской по умолчанию
 *
 * @example
 * ```ts
 * const {
 *   selectedBoard,
 *   hasSelectedBoard,
 *   selectBoard,
 *   deselectBoard
 * } = useSelectedBoard()
 *
 * // Выбрать доску
 * await selectBoard(boardId)
 *
 * // Сбросить выбор
 * await deselectBoard()
 * ```
 */
export function useSelectedBoard() {
  const selectedBoardStore = useSelectedBoardStore()
  const { showToast } = useToast()

  // State
  const { selectedBoard, hasSelectedBoard, selectedBoardId, selectedBoardTitle, isLoading } =
    storeToRefs(selectedBoardStore)

  // Actions
  const fetchSelectedBoard = async () => {
    try {
      return await selectedBoardStore.fetchSelectedBoard()
    } catch (error) {
      console.error('[useSelectedBoard] Fetch selected board failed:', error)
      return null
    }
  }

  const selectBoard = async (boardId: string) => {
    try {
      await selectedBoardStore.selectBoard(boardId)
      showToast('Board selected!', 'success')
    } catch (error) {
      console.error('[useSelectedBoard] Select board failed:', error)
      showToast('Failed to select board', 'error')
      throw error
    }
  }

  const deselectBoard = async () => {
    try {
      await selectedBoardStore.deselectBoard()
      showToast('Board deselected!', 'success')
    } catch (error) {
      console.error('[useSelectedBoard] Deselect board failed:', error)
      showToast('Failed to deselect board', 'error')
      throw error
    }
  }

  const setBoard = async (board: Board | null) => {
    try {
      await selectedBoardStore.setBoard(board)
    } catch (error) {
      console.error('[useSelectedBoard] Set board failed:', error)
      throw error
    }
  }

  return {
    selectedBoard,
    hasSelectedBoard,
    selectedBoardId,
    selectedBoardTitle,
    isLoading,
    fetchSelectedBoard,
    selectBoard,
    deselectBoard,
    setBoard,
  }
}

/**
 * useBoardDetail
 *
 * Для детальной страницы доски
 *
 * @example
 * ```ts
 * const { board, pins, isLoading, fetchBoard } = useBoardDetail(boardId)
 *
 * await fetchBoard()
 * ```
 */
export function useBoardDetail(boardId: Ref<string> | string) {
  const { fetchBoardById, currentBoard, currentBoardPins, isLoadingPins } = useBoards()

  const id = computed(() => (typeof boardId === 'string' ? boardId : boardId.value))

  const fetchBoard = async (page = 0, size = 15) => {
    await fetchBoardById(id.value, page, size)
  }

  return {
    board: currentBoard,
    pins: currentBoardPins,
    isLoading: isLoadingPins,
    fetchBoard,
  }
}
