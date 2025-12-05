// src/composables/api/useBoards.ts
/**
 * useBoards - Единый composable для работы с досками
 *
 * Объединяет функционал из useBoardDetail и useMyBoards
 * с дополнительными методами для CRUD операций
 */

import { ref, computed, onUnmounted } from 'vue'
import { useBoardsStore, useSelectedBoardStore } from '@/stores/boards.store'
import type { Board, BoardWithPins, PinWithBlob } from '@/types'

export interface UseBoardsOptions {
  /** Автоматически загружать мои доски */
  loadOnMount?: boolean
}

export function useBoards(options: UseBoardsOptions = {}) {
  const { loadOnMount = false } = options

  const boardsStore = useBoardsStore()
  const selectedBoardStore = useSelectedBoardStore()

  // ============ STATE ============
  const error = ref<Error | null>(null)

  // ============ COMPUTED ============

  /** Мои доски */
  const myBoards = computed<BoardWithPins[]>(() => boardsStore.myBoards)

  /** Текущая доска (для детального просмотра) */
  const currentBoard = computed<BoardWithPins | null>(() => boardsStore.currentBoard ?? null)

  /** Пины текущей доски */
  const currentBoardPins = computed<PinWithBlob[]>(() => boardsStore.currentBoardPins)

  /** Есть ли ещё пины для загрузки */
  const hasBoardPinsMore = computed(() => boardsStore.hasBoardPinsMore)

  /** Выбранная доска для сохранения */
  const selectedBoard = computed(() => selectedBoardStore.selectedBoard)

  /** Loading states */
  const isLoading = computed(() => boardsStore.isLoading)
  const isLoadingPins = computed(() => boardsStore.isLoadingPins)

  // ============ ACTIONS: FETCH ============

  /**
   * Загрузить мои доски
   */
  async function fetchMyBoards(forceReload = false): Promise<BoardWithPins[]> {
    try {
      error.value = null
      return await boardsStore.fetchMyBoards(forceReload)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Загрузить доски пользователя
   */
  async function fetchUserBoards(userId: string, forceReload = false): Promise<BoardWithPins[]> {
    try {
      error.value = null
      return await boardsStore.fetchUserBoards(userId, forceReload)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Загрузить доску по ID
   */
  async function fetchBoardById(boardId: string, forceReload = false): Promise<BoardWithPins> {
    try {
      error.value = null
      return await boardsStore.fetchBoardById(boardId, forceReload)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Загрузить пины доски
   */
  async function fetchBoardPins(boardId: string, page = 0, size = 15): Promise<PinWithBlob[]> {
    try {
      error.value = null
      return await boardsStore.fetchBoardPins(boardId, page, size)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Загрузить больше пинов
   */
  async function loadMoreBoardPins(): Promise<void> {
    try {
      error.value = null
      await boardsStore.loadMoreBoardPins()
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  // ============ ACTIONS: CRUD ============

  /**
   * Создать доску
   */
  async function createBoard(title: string): Promise<BoardWithPins> {
    try {
      error.value = null
      return await boardsStore.createBoard(title)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function updateBoard(boardId: string, title: string) {
    try {
      error.value = null
      return await boardsStore.updateBoard(boardId, title)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Удалить доску
   */
  async function deleteBoard(boardId: string): Promise<void> {
    try {
      error.value = null
      await boardsStore.deleteBoard(boardId)

      // Сбросить выбранную доску если она была удалена
      if (selectedBoardStore.selectedBoardId === boardId) {
        selectedBoardStore.clearSelectedBoard()
      }
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Добавить пин в доску
   */
  async function addPinToBoard(boardId: string, pinId: string): Promise<void> {
    try {
      error.value = null
      await boardsStore.addPinToBoard(boardId, pinId)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Удалить пин из доски
   */
  async function removePinFromBoard(boardId: string, pinId: string): Promise<void> {
    try {
      error.value = null
      await boardsStore.removePinFromBoard(boardId, pinId)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  // ============ ACTIONS: SELECTED BOARD ============

  /**
   * Выбрать доску для сохранения пинов
   */
  async function selectBoard(boardId: string): Promise<void> {
    try {
      error.value = null
      await selectedBoardStore.selectBoard(boardId)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /**
   * Сбросить выбор (сохранять в профиль)
   */
  async function deselectBoard(): Promise<void> {
    try {
      error.value = null
      await selectedBoardStore.deselectBoard()
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  // ============ HELPERS ============

  /**
   * Получить доску по ID из кэша
   */
  function getBoardById(boardId: string): BoardWithPins | undefined {
    return boardsStore.getBoardById(boardId)
  }

  /**
   * Очистить текущую доску
   */
  function clearCurrentBoard(): void {
    boardsStore.clearCurrentBoard()
  }

  /**
   * Очистить все данные
   */
  function clearAll(): void {
    boardsStore.clearAll()
  }

  // ============ LIFECYCLE ============

  if (loadOnMount) {
    fetchMyBoards()
  }

  onUnmounted(() => {
    // Очищаем только текущую доску, не все данные
    clearCurrentBoard()
  })

  return {
    // State
    myBoards,
    currentBoard,
    currentBoardPins,
    hasBoardPinsMore,
    selectedBoard,
    isLoading,
    isLoadingPins,
    error,

    // Fetch
    fetchMyBoards,
    fetchUserBoards,
    fetchBoardById,
    fetchBoardPins,
    loadMoreBoardPins,

    // CRUD
    createBoard,
    updateBoard,
    deleteBoard,
    addPinToBoard,
    removePinFromBoard,

    // Selected board
    selectBoard,
    deselectBoard,

    // Helpers
    getBoardById,
    clearCurrentBoard,
    clearAll,
  }
}

/**
 * useBoardPins - Для работы с пинами конкретной доски
 */
export function useBoardPins(boardId: string | (() => string)) {
  const boardsStore = useBoardsStore()

  const getId = () => (typeof boardId === 'string' ? boardId : boardId())

  const pins = computed(() => boardsStore.currentBoardPins)
  const hasMore = computed(() => boardsStore.hasBoardPinsMore)
  const isLoading = computed(() => boardsStore.isLoadingPins)

  async function fetch(page = 0, size = 15) {
    return await boardsStore.fetchBoardPins(getId(), page, size)
  }

  async function loadMore() {
    return await boardsStore.loadMoreBoardPins()
  }

  async function removePin(pinId: string) {
    return await boardsStore.removePinFromBoard(getId(), pinId)
  }

  function cleanup() {
    boardsStore.clearCurrentBoard()
  }

  onUnmounted(cleanup)

  return {
    pins,
    hasMore,
    isLoading,
    fetch,
    loadMore,
    removePin,
    cleanup,
  }
}
