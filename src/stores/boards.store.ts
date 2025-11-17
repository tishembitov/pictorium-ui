// src/stores/boards.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BoardResponse, PinResponse, PagePinResponse } from '@/types/api.types'
import { boardsApi } from '@/api/boards.api'
import { storageApi } from '@/api/storage.api'

interface BoardWithPins extends BoardResponse {
  pins?: PinResponse[]
  pinsCount?: number
}

export const useBoardsStore = defineStore('boards', () => {
  // ============ STATE ============

  // Доски текущего пользователя
  const myBoards = ref<BoardWithPins[]>([])

  // Кэш досок других пользователей (key: userId)
  const userBoardsCache = ref<Map<string, BoardWithPins[]>>(new Map())

  // Текущая просматриваемая доска
  const currentBoard = ref<BoardWithPins | null>(null)
  const currentBoardPins = ref<PinResponse[]>([])

  // Пагинация пинов доски
  const boardPinsPage = ref(0)
  const boardPinsTotal = ref(0)

  // Loading states
  const isLoading = ref(false)
  const isLoadingPins = ref(false)

  // ============ GETTERS ============

  const getBoardById = computed(() => (boardId: string) => {
    return myBoards.value.find((b) => b.id === boardId)
  })

  const hasBoardPinsMore = computed(() => currentBoardPins.value.length < boardPinsTotal.value)

  // ============ ACTIONS ============

  /**
   * Загрузка моих досок
   */
  async function fetchMyBoards() {
    try {
      isLoading.value = true
      const boards = await boardsApi.getMyBoards()

      // Загружаем превью пинов (первые 4)
      myBoards.value = await Promise.all(
        boards.map(async (board) => {
          try {
            const pinsResponse = await boardsApi.getBoardPins(board.id, {
              page: 0,
              size: 4,
              sort: [],
            })

            // Загружаем blob URLs для превью
            const pinsWithBlobs = await loadPinBlobs(pinsResponse.content)

            return {
              ...board,
              pins: pinsWithBlobs,
              pinsCount: pinsResponse.totalElements,
            }
          } catch (error) {
            console.error(`Failed to load pins for board ${board.id}:`, error)
            return { ...board, pins: [], pinsCount: 0 }
          }
        }),
      )

      return myBoards.value
    } catch (error) {
      console.error('Failed to fetch my boards:', error)
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
      if (!forceReload && userBoardsCache.value.has(userId)) {
        return userBoardsCache.value.get(userId)!
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

            const pinsWithBlobs = await loadPinBlobs(pinsResponse.content)

            return {
              ...board,
              pins: pinsWithBlobs,
              pinsCount: pinsResponse.totalElements,
            }
          } catch (error) {
            return { ...board, pins: [], pinsCount: 0 }
          }
        }),
      )

      userBoardsCache.value.set(userId, boardsWithPins)
      return boardsWithPins
    } catch (error) {
      console.error('Failed to fetch user boards:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузка одной доски с пинами
   */
  async function fetchBoardById(boardId: string, page = 0, size = 15) {
    try {
      isLoadingPins.value = page === 0

      // Загружаем инфо о доске
      if (page === 0 || !currentBoard.value) {
        const board = await boardsApi.getBoardById(boardId)
        currentBoard.value = board
      }

      // Загружаем пины
      const pinsResponse: PagePinResponse = await boardsApi.getBoardPins(boardId, {
        page,
        size,
        sort: ['createdAt,desc'],
      })

      boardPinsTotal.value = pinsResponse.totalElements
      boardPinsPage.value = page

      const pinsWithBlobs = await loadPinBlobs(pinsResponse.content)

      if (page === 0) {
        currentBoardPins.value = pinsWithBlobs
      } else {
        currentBoardPins.value.push(...pinsWithBlobs)
      }

      return pinsWithBlobs
    } catch (error) {
      console.error('Failed to fetch board:', error)
      throw error
    } finally {
      isLoadingPins.value = false
    }
  }

  /**
   * Загрузка следующей страницы пинов доски
   */
  async function loadMoreBoardPins() {
    if (!currentBoard.value || !hasBoardPinsMore.value) return
    await fetchBoardById(currentBoard.value.id, boardPinsPage.value + 1)
  }

  /**
   * Создание доски
   */
  async function createBoard(title: string) {
    try {
      isLoading.value = true
      const board = await boardsApi.createBoard({ title })

      // Добавляем в начало списка
      myBoards.value.unshift({
        ...board,
        pins: [],
        pinsCount: 0,
      })

      return board
    } catch (error) {
      console.error('Failed to create board:', error)
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
      await boardsApi.deleteBoard(boardId)

      // Удаляем из списка
      myBoards.value = myBoards.value.filter((b) => b.id !== boardId)

      // Сбрасываем текущую доску если она удалена
      if (currentBoard.value?.id === boardId) {
        currentBoard.value = null
        currentBoardPins.value = []
      }
    } catch (error) {
      console.error('Failed to delete board:', error)
      throw error
    }
  }

  /**
   * Добавление пина на доску
   */
  async function addPinToBoard(boardId: string, pinId: string) {
    try {
      await boardsApi.addPinToBoard(boardId, pinId)

      // Увеличиваем счетчик
      const board = myBoards.value.find((b) => b.id === boardId)
      if (board && board.pinsCount !== undefined) {
        board.pinsCount += 1
      }

      // Обновляем текущую доску если она открыта
      if (currentBoard.value?.id === boardId) {
        await fetchBoardById(boardId, 0)
      }
    } catch (error) {
      console.error('Failed to add pin to board:', error)
      throw error
    }
  }

  /**
   * Удаление пина с доски
   */
  async function removePinFromBoard(boardId: string, pinId: string) {
    try {
      await boardsApi.removePinFromBoard(boardId, pinId)

      // Уменьшаем счетчик
      const board = myBoards.value.find((b) => b.id === boardId)
      if (board && board.pinsCount !== undefined) {
        board.pinsCount = Math.max(0, board.pinsCount - 1)
      }

      // Удаляем из текущих пинов
      if (currentBoard.value?.id === boardId) {
        currentBoardPins.value = currentBoardPins.value.filter((p) => p.id !== pinId)
        boardPinsTotal.value = Math.max(0, boardPinsTotal.value - 1)
      }
    } catch (error) {
      console.error('Failed to remove pin from board:', error)
      throw error
    }
  }

  /**
   * Очистка текущей доски
   */
  function clearCurrentBoard() {
    currentBoard.value = null
    currentBoardPins.value = []
    boardPinsPage.value = 0
    boardPinsTotal.value = 0
  }

  // ============ HELPERS ============

  /**
   * Загрузка blob URLs для пинов
   */
  async function loadPinBlobs(pins: PinResponse[]): Promise<PinResponse[]> {
    return Promise.all(
      pins.map(async (pin) => {
        try {
          if (pin.imageUrl) {
            const blob = await storageApi.downloadImage(pin.imageUrl)
            const blobUrl = URL.createObjectURL(blob)
            return { ...pin, imageBlobUrl: blobUrl, isImage: true }
          } else if (pin.videoPreviewUrl) {
            const blob = await storageApi.downloadImage(pin.videoPreviewUrl)
            const blobUrl = URL.createObjectURL(blob)
            return { ...pin, videoBlobUrl: blobUrl, isVideo: true }
          }
        } catch (error) {
          console.error(`Failed to load media for pin ${pin.id}:`, error)
        }
        return pin
      }),
    )
  }

  return {
    // State
    myBoards,
    userBoardsCache,
    currentBoard,
    currentBoardPins,
    isLoading,
    isLoadingPins,

    // Getters
    getBoardById,
    hasBoardPinsMore,

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
  }
})
