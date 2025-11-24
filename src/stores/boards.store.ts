// src/stores/boards.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type {
  BoardResponse,
  PinResponse,
  PagePinResponse,
  BoardWithPins,
  PinWithBlob,
} from '@/types'
import { boardsApi, selectedBoardApi } from '@/api/boards.api'
import { storageApi } from '@/api/storage.api'

export const useBoardsStore = defineStore('boards', () => {
  // ============ STATE ============

  // Единый кэш досок по ID - используем reactive для Map
  const boardsCache = reactive(new Map<string, BoardWithPins>())

  // Мои доски (только ID)
  const myBoardIds = ref<string[]>([])

  // Доски пользователей (key: userId, value: boardIds[]) - reactive для Map
  const userBoardIds = reactive(new Map<string, string[]>())

  // Текущая просматриваемая доска
  const currentBoardId = ref<string | null>(null)

  // Пины текущей доски
  const currentBoardPins = ref<PinWithBlob[]>([])

  // Пагинация пинов доски
  const boardPinsPage = ref(0)
  const boardPinsTotal = ref(0)
  const boardPinsSize = ref(15)

  // Loading states
  const isLoading = ref(false)
  const isLoadingPins = ref(false)

  // ============ GETTERS ============

  const myBoards = computed(() => {
    return myBoardIds.value
      .map((id) => boardsCache.get(id))
      .filter((board): board is BoardWithPins => board !== undefined)
  })

  const currentBoard = computed(() => {
    return currentBoardId.value ? boardsCache.get(currentBoardId.value) : null
  })

  const getBoardById = computed(() => (boardId: string) => {
    return boardsCache.get(boardId)
  })

  const getUserBoards = computed(() => (userId: string) => {
    const boardIds = userBoardIds.get(userId) || []
    return boardIds
      .map((id) => boardsCache.get(id))
      .filter((board): board is BoardWithPins => board !== undefined)
  })

  const hasBoardPinsMore = computed(() => currentBoardPins.value.length < boardPinsTotal.value)

  // ============ ACTIONS ============

  /**
   * Загрузка моих досок
   */
  async function fetchMyBoards(forceReload = false) {
    try {
      if (!forceReload && myBoardIds.value.length > 0) {
        return myBoards.value
      }

      isLoading.value = true

      const boards = await boardsApi.getMyBoards()

      // Загружаем превью пинов параллельно
      const boardsWithPins = await Promise.all(
        boards.map(async (board) => {
          try {
            const pinsResponse = await boardsApi.getBoardPins(board.id, {
              page: 0,
              size: 4,
              sort: [],
            })

            const pinsWithBlobs = await loadPinsBlobs(pinsResponse.content)

            const boardWithPins: BoardWithPins = {
              ...board,
              pins: pinsWithBlobs,
              pinsCount: pinsResponse.totalElements,
            }

            // Кэшируем
            boardsCache.set(board.id, boardWithPins)

            return boardWithPins
          } catch (error) {
            console.error(`[Boards] Failed to load pins for board ${board.id}:`, error)
            const boardWithPins: BoardWithPins = {
              ...board,
              pins: [],
              pinsCount: 0,
            }
            boardsCache.set(board.id, boardWithPins)
            return boardWithPins
          }
        }),
      )

      // Сохраняем ID досок
      myBoardIds.value = boardsWithPins.map((b) => b.id)

      return boardsWithPins
    } catch (error) {
      console.error('[Boards] Failed to fetch my boards:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузка досок пользователя
   */
  async function fetchUserBoards(userId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && userBoardIds.has(userId)) {
        return getUserBoards.value(userId)
      }

      isLoading.value = true

      const boards = await boardsApi.getUserBoards(userId)

      // Загружаем превью
      const boardsWithPins = await Promise.all(
        boards.map(async (board) => {
          try {
            const pinsResponse = await boardsApi.getBoardPins(board.id, {
              page: 0,
              size: 4,
              sort: [],
            })

            const pinsWithBlobs = await loadPinsBlobs(pinsResponse.content)

            const boardWithPins: BoardWithPins = {
              ...board,
              pins: pinsWithBlobs,
              pinsCount: pinsResponse.totalElements,
            }

            boardsCache.set(board.id, boardWithPins)
            return boardWithPins
          } catch (error) {
            const boardWithPins: BoardWithPins = {
              ...board,
              pins: [],
              pinsCount: 0,
            }
            boardsCache.set(board.id, boardWithPins)
            return boardWithPins
          }
        }),
      )

      // Сохраняем ID досок
      userBoardIds.set(
        userId,
        boardsWithPins.map((b) => b.id),
      )

      return boardsWithPins
    } catch (error) {
      console.error('[Boards] Failed to fetch user boards:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузка одной доски по ID
   */
  async function fetchBoardById(boardId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && boardsCache.has(boardId)) {
        return boardsCache.get(boardId)!
      }

      const board = await boardsApi.getById(boardId)

      // Загружаем превью пинов
      const pinsResponse = await boardsApi.getBoardPins(board.id, {
        page: 0,
        size: 4,
        sort: [],
      })

      const pinsWithBlobs = await loadPinsBlobs(pinsResponse.content)

      const boardWithPins: BoardWithPins = {
        ...board,
        pins: pinsWithBlobs,
        pinsCount: pinsResponse.totalElements,
      }

      boardsCache.set(boardId, boardWithPins)
      return boardWithPins
    } catch (error) {
      console.error('[Boards] Failed to fetch board:', error)
      throw error
    }
  }

  /**
   * Загрузка пинов доски
   */
  async function fetchBoardPins(boardId: string, page = 0, size = 15) {
    try {
      isLoadingPins.value = page === 0

      // Устанавливаем текущую доску
      if (page === 0 || currentBoardId.value !== boardId) {
        currentBoardId.value = boardId

        // Загружаем инфо о доске если еще не в кэше
        if (!boardsCache.has(boardId)) {
          await fetchBoardById(boardId)
        }
      }

      // Загружаем пины
      const response: PagePinResponse = await boardsApi.getBoardPins(boardId, {
        page,
        size,
        sort: ['createdAt,desc'],
      })

      boardPinsTotal.value = response.totalElements
      boardPinsPage.value = page
      boardPinsSize.value = size

      const pinsWithBlobs = await loadPinsBlobs(response.content)

      if (page === 0) {
        // Очищаем старые blob URLs
        cleanupPinsBlobs(currentBoardPins.value)
        currentBoardPins.value = pinsWithBlobs
      } else {
        currentBoardPins.value.push(...pinsWithBlobs)
      }

      return pinsWithBlobs
    } catch (error) {
      console.error('[Boards] Failed to fetch board pins:', error)
      throw error
    } finally {
      isLoadingPins.value = false
    }
  }

  /**
   * Загрузка следующей страницы пинов
   */
  async function loadMoreBoardPins() {
    if (!currentBoardId.value || !hasBoardPinsMore.value || isLoadingPins.value) return
    await fetchBoardPins(currentBoardId.value, boardPinsPage.value + 1, boardPinsSize.value)
  }

  /**
   * Создание доски
   */
  async function createBoard(title: string) {
    try {
      isLoading.value = true

      const board = await boardsApi.create({ title })

      const boardWithPins: BoardWithPins = {
        ...board,
        pins: [],
        pinsCount: 0,
      }

      // Кэшируем
      boardsCache.set(board.id, boardWithPins)

      // Добавляем в начало моих досок
      myBoardIds.value.unshift(board.id)

      return boardWithPins
    } catch (error) {
      console.error('[Boards] Failed to create board:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Удаление доски
   */
  async function deleteBoard(boardId: string) {
    try {
      await boardsApi.delete(boardId)

      // Очищаем blob URLs пинов доски
      const board = boardsCache.get(boardId)
      if (board?.pins) {
        cleanupPinsBlobs(board.pins)
      }

      // Удаляем из кэша
      boardsCache.delete(boardId)

      // Удаляем из списка моих досок
      myBoardIds.value = myBoardIds.value.filter((id) => id !== boardId)

      // Сбрасываем текущую доску если она удалена
      if (currentBoardId.value === boardId) {
        cleanupPinsBlobs(currentBoardPins.value)
        currentBoardId.value = null
        currentBoardPins.value = []
        boardPinsPage.value = 0
        boardPinsTotal.value = 0
      }
    } catch (error) {
      console.error('[Boards] Failed to delete board:', error)
      throw error
    }
  }

  /**
   * Добавление пина на доску
   */
  async function addPinToBoard(boardId: string, pinId: string) {
    try {
      await boardsApi.addPin(boardId, pinId)

      // Обновляем счетчик
      const board = boardsCache.get(boardId)
      if (board && board.pinsCount !== undefined) {
        board.pinsCount += 1
      }

      // Обновляем текущую доску если она открыта
      if (currentBoardId.value === boardId) {
        await fetchBoardPins(boardId, 0, boardPinsSize.value)
      }
    } catch (error) {
      console.error('[Boards] Failed to add pin to board:', error)
      throw error
    }
  }

  /**
   * Удаление пина с доски
   */
  async function removePinFromBoard(boardId: string, pinId: string) {
    try {
      await boardsApi.removePin(boardId, pinId)

      // Уменьшаем счетчик
      const board = boardsCache.get(boardId)
      if (board && board.pinsCount !== undefined) {
        board.pinsCount = Math.max(0, board.pinsCount - 1)
      }

      // Удаляем из текущих пинов
      if (currentBoardId.value === boardId) {
        // Находим и очищаем blob URLs удаляемого пина
        const pinToRemove = currentBoardPins.value.find((p) => p.id === pinId)
        if (pinToRemove) {
          cleanupPinBlobs(pinToRemove)
        }

        currentBoardPins.value = currentBoardPins.value.filter((p) => p.id !== pinId)
        boardPinsTotal.value = Math.max(0, boardPinsTotal.value - 1)
      }

      // Удаляем из превью доски
      if (board?.pins) {
        const pinToRemove = board.pins.find((p) => p.id === pinId)
        if (pinToRemove) {
          cleanupPinBlobs(pinToRemove)
        }
        board.pins = board.pins.filter((p) => p.id !== pinId)
      }
    } catch (error) {
      console.error('[Boards] Failed to remove pin from board:', error)
      throw error
    }
  }

  // ============ BLOB LOADING (из pins.store.ts) ============

  /**
   * Загрузка blob URL для одного пина
   */
  async function loadPinBlob(pin: PinResponse): Promise<PinWithBlob> {
    const pinWithBlob: PinWithBlob = { ...pin }

    try {
      if (pin.imageUrl) {
        const blob = await storageApi.downloadImage(pin.imageUrl)
        const contentType = blob.type

        pinWithBlob.imageBlobUrl = URL.createObjectURL(blob)
        pinWithBlob.isImage = !contentType.startsWith('video/')
        pinWithBlob.isGif = contentType === 'image/gif'
        pinWithBlob.isVideo = contentType.startsWith('video/')
      }

      if (pin.videoPreviewUrl) {
        const blob = await storageApi.downloadImage(pin.videoPreviewUrl)
        pinWithBlob.videoBlobUrl = URL.createObjectURL(blob)
        pinWithBlob.isVideo = true
      }
    } catch (error) {
      console.error(`[Boards] Failed to load media for pin ${pin.id}:`, error)
    }

    return pinWithBlob
  }

  /**
   * Загрузка blob URLs для массива пинов (параллельно)
   */
  async function loadPinsBlobs(pins: PinResponse[]): Promise<PinWithBlob[]> {
    return Promise.all(pins.map(loadPinBlob))
  }

  // ============ CLEANUP HELPERS ============

  /**
   * Очистка blob URLs одного пина
   */
  function cleanupPinBlobs(pin: PinWithBlob) {
    if (pin.imageBlobUrl) {
      URL.revokeObjectURL(pin.imageBlobUrl)
      pin.imageBlobUrl = undefined
    }
    if (pin.videoBlobUrl) {
      URL.revokeObjectURL(pin.videoBlobUrl)
      pin.videoBlobUrl = undefined
    }
  }

  /**
   * Очистка blob URLs массива пинов
   */
  function cleanupPinsBlobs(pins: PinWithBlob[]) {
    pins.forEach((pin) => cleanupPinBlobs(pin))
  }

  /**
   * Очистка blob URLs доски
   */
  function cleanupBoardBlobs(board: BoardWithPins) {
    if (board.pins) {
      cleanupPinsBlobs(board.pins)
    }
  }

  /**
   * Очистка текущей доски
   */
  function clearCurrentBoard() {
    // Очищаем blob URLs
    cleanupPinsBlobs(currentBoardPins.value)

    currentBoardId.value = null
    currentBoardPins.value = []
    boardPinsPage.value = 0
    boardPinsTotal.value = 0
  }

  /**
   * Очистка кэша пользователя
   */
  function clearUserCache(userId: string) {
    const boardIds = userBoardIds.get(userId) || []

    // Очищаем blob URLs всех досок пользователя
    boardIds.forEach((id) => {
      const board = boardsCache.get(id)
      if (board) {
        cleanupBoardBlobs(board)
      }
      boardsCache.delete(id)
    })

    userBoardIds.delete(userId)
  }

  /**
   * Очистка всего
   */
  function clearAll() {
    // Очищаем blob URLs всех досок
    boardsCache.forEach((board) => {
      cleanupBoardBlobs(board)
    })

    // Очищаем текущую доску
    cleanupPinsBlobs(currentBoardPins.value)

    boardsCache.clear()
    myBoardIds.value = []
    userBoardIds.clear()
    currentBoardId.value = null
    currentBoardPins.value = []
    boardPinsPage.value = 0
    boardPinsTotal.value = 0
  }

  return {
    // State
    boardsCache,
    myBoardIds,
    userBoardIds,
    currentBoardId,
    currentBoardPins,
    boardPinsPage,
    boardPinsTotal,
    isLoading,
    isLoadingPins,

    // Getters
    myBoards,
    currentBoard,
    getBoardById,
    getUserBoards,
    hasBoardPinsMore,

    // Actions
    fetchMyBoards,
    fetchUserBoards,
    fetchBoardById,
    fetchBoardPins,
    loadMoreBoardPins,
    createBoard,
    deleteBoard,
    addPinToBoard,
    removePinFromBoard,
    clearCurrentBoard,
    clearUserCache,
    clearAll,
  }
})

// ============================================================================
// SELECTED BOARD STORE
// ============================================================================

export const useSelectedBoardStore = defineStore('selectedBoard', () => {
  // ============ STATE ============

  const selectedBoard = ref<BoardResponse | null>(null)
  const isLoading = ref(false)

  // ============ GETTERS ============

  const hasSelectedBoard = computed(() => selectedBoard.value !== null)
  const selectedBoardId = computed(() => selectedBoard.value?.id || null)
  const selectedBoardTitle = computed(() => selectedBoard.value?.title || 'Profile')

  // ============ ACTIONS ============

  /**
   * Загрузка выбранной доски
   */
  async function fetchSelectedBoard() {
    try {
      isLoading.value = true

      const board = await selectedBoardApi.getSelectedBoard()
      selectedBoard.value = board

      console.log('[SelectedBoard] Selected board loaded:', board)
      return board
    } catch (error) {
      // Если доска не выбрана - это нормально (404)
      console.log('[SelectedBoard] No board selected (this is normal)')
      selectedBoard.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Выбор доски по умолчанию
   */
  async function selectBoard(boardId: string) {
    try {
      isLoading.value = true

      await selectedBoardApi.selectBoard(boardId)

      // Обновляем локальное состояние
      await fetchSelectedBoard()

      console.log('[SelectedBoard] Board selected:', boardId)
    } catch (error) {
      console.error('[SelectedBoard] Failed to select board:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Сброс выбранной доски (сохранение в Profile)
   */
  async function deselectBoard() {
    try {
      isLoading.value = true

      await selectedBoardApi.deselectBoard()
      selectedBoard.value = null

      console.log('[SelectedBoard] Board deselected (saving to Profile)')
    } catch (error) {
      console.error('[SelectedBoard] Failed to deselect board:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Установка доски (универсальный метод)
   */
  async function setBoard(board: BoardResponse | null) {
    if (board === null) {
      await deselectBoard()
    } else {
      await selectBoard(board.id)
    }
  }

  /**
   * Очистка (для logout)
   */
  function clearSelectedBoard() {
    selectedBoard.value = null
  }

  return {
    // State
    selectedBoard,
    isLoading,

    // Getters
    hasSelectedBoard,
    selectedBoardId,
    selectedBoardTitle,

    // Actions
    fetchSelectedBoard,
    selectBoard,
    deselectBoard,
    setBoard,
    clearSelectedBoard,
  }
})
