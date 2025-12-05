// src/stores/boards.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Board, Pin, BoardWithPins, PinWithBlob, PagePin } from '@/types'
import { boardsApi, selectedBoardApi, storageApi } from '@/api'

export const useBoardsStore = defineStore('boards', () => {
  // ============ STATE ============

  const boardsCache = reactive(new Map<string, BoardWithPins>())
  const myBoardIds = ref<string[]>([])
  const userBoardIds = reactive(new Map<string, string[]>())
  const currentBoardId = ref<string | null>(null)
  const currentBoardPins = ref<PinWithBlob[]>([])
  const boardPinsPage = ref(0)
  const boardPinsTotal = ref(0)
  const boardPinsSize = ref(15)
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

  async function fetchMyBoards(forceReload = false) {
    try {
      if (!forceReload && myBoardIds.value.length > 0) {
        return myBoards.value
      }

      isLoading.value = true

      const boards = await boardsApi.getMyBoards()

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

      myBoardIds.value = boardsWithPins.map((b) => b.id)
      return boardsWithPins
    } catch (error) {
      console.error('[Boards] Failed to fetch my boards:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserBoards(userId: string, forceReload = false) {
    try {
      if (!forceReload && userBoardIds.has(userId)) {
        return getUserBoards.value(userId)
      }

      isLoading.value = true

      const boards = await boardsApi.getUserBoards(userId)

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

  async function fetchBoardById(boardId: string, forceReload = false) {
    try {
      if (!forceReload && boardsCache.has(boardId)) {
        return boardsCache.get(boardId)!
      }

      const board = await boardsApi.getById(boardId)

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

  async function fetchBoardPins(boardId: string, page = 0, size = 15) {
    try {
      isLoadingPins.value = page === 0

      if (page === 0 || currentBoardId.value !== boardId) {
        currentBoardId.value = boardId

        if (!boardsCache.has(boardId)) {
          await fetchBoardById(boardId)
        }
      }

      const response: PagePin = await boardsApi.getBoardPins(boardId, {
        page,
        size,
        sort: ['createdAt,desc'],
      })

      boardPinsTotal.value = response.totalElements
      boardPinsPage.value = page
      boardPinsSize.value = size

      const pinsWithBlobs = await loadPinsBlobs(response.content)

      if (page === 0) {
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

  async function loadMoreBoardPins() {
    if (!currentBoardId.value || !hasBoardPinsMore.value || isLoadingPins.value) return
    await fetchBoardPins(currentBoardId.value, boardPinsPage.value + 1, boardPinsSize.value)
  }

  async function createBoard(title: string) {
    try {
      isLoading.value = true

      const board = await boardsApi.create({ title })

      const boardWithPins: BoardWithPins = {
        ...board,
        pins: [],
        pinsCount: 0,
      }

      boardsCache.set(board.id, boardWithPins)
      myBoardIds.value.unshift(board.id)

      return boardWithPins
    } catch (error) {
      console.error('[Boards] Failed to create board:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function updateBoard(boardId: string, title: string) {
    try {
      const updated = await boardsApi.update(boardId, { title })

      // Update cache
      const cached = boardsCache.get(boardId)
      if (cached) {
        boardsCache.set(boardId, { ...cached, title: updated.title })
      }

      return updated
    } catch (error) {
      console.error('[Boards] Failed to update board:', error)
      throw error
    }
  }

  async function deleteBoard(boardId: string) {
    try {
      await boardsApi.delete(boardId)

      const board = boardsCache.get(boardId)
      if (board?.pins) {
        cleanupPinsBlobs(board.pins)
      }

      boardsCache.delete(boardId)
      myBoardIds.value = myBoardIds.value.filter((id) => id !== boardId)

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

  async function addPinToBoard(boardId: string, pinId: string) {
    try {
      await boardsApi.addPin(boardId, pinId)

      const board = boardsCache.get(boardId)
      if (board?.pinsCount !== undefined) {
        board.pinsCount += 1
      }

      if (currentBoardId.value === boardId) {
        await fetchBoardPins(boardId, 0, boardPinsSize.value)
      }
    } catch (error) {
      console.error('[Boards] Failed to add pin to board:', error)
      throw error
    }
  }

  async function removePinFromBoard(boardId: string, pinId: string) {
    try {
      await boardsApi.removePin(boardId, pinId)

      const board = boardsCache.get(boardId)
      if (board?.pinsCount !== undefined) {
        board.pinsCount = Math.max(0, board.pinsCount - 1)
      }

      if (currentBoardId.value === boardId) {
        const pinToRemove = currentBoardPins.value.find((p) => p.id === pinId)
        if (pinToRemove) {
          cleanupPinBlobs(pinToRemove)
        }

        currentBoardPins.value = currentBoardPins.value.filter((p) => p.id !== pinId)
        boardPinsTotal.value = Math.max(0, boardPinsTotal.value - 1)
      }

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

  // ============ BLOB LOADING ============

  async function loadPinBlob(pin: Pin): Promise<PinWithBlob> {
    const pinWithBlob: PinWithBlob = { ...pin }

    try {
      if (pin.imageId) {
        const blob = await storageApi.downloadImage(pin.imageId)
        const contentType = blob.type

        pinWithBlob.imageBlobUrl = URL.createObjectURL(blob)
        pinWithBlob.isImage = !contentType.startsWith('video/')
        pinWithBlob.isGif = contentType === 'image/gif'
        pinWithBlob.isVideo = contentType.startsWith('video/')
      }

      if (pin.videoPreviewId) {
        const blob = await storageApi.downloadImage(pin.videoPreviewId)
        pinWithBlob.videoBlobUrl = URL.createObjectURL(blob)
        pinWithBlob.isVideo = true
      }
    } catch (error) {
      console.error(`[Boards] Failed to load media for pin ${pin.id}:`, error)
    }

    return pinWithBlob
  }

  async function loadPinsBlobs(pins: Pin[]): Promise<PinWithBlob[]> {
    return Promise.all(pins.map(loadPinBlob))
  }

  // ============ CLEANUP HELPERS ============

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

  function cleanupPinsBlobs(pins: PinWithBlob[]) {
    pins.forEach((pin) => cleanupPinBlobs(pin))
  }

  function cleanupBoardBlobs(board: BoardWithPins) {
    if (board.pins) {
      cleanupPinsBlobs(board.pins)
    }
  }

  function clearCurrentBoard() {
    cleanupPinsBlobs(currentBoardPins.value)
    currentBoardId.value = null
    currentBoardPins.value = []
    boardPinsPage.value = 0
    boardPinsTotal.value = 0
  }

  function clearUserCache(userId: string) {
    const boardIds = userBoardIds.get(userId) || []

    boardIds.forEach((id) => {
      const board = boardsCache.get(id)
      if (board) {
        cleanupBoardBlobs(board)
      }
      boardsCache.delete(id)
    })

    userBoardIds.delete(userId)
  }

  function clearAll() {
    boardsCache.forEach((board) => {
      cleanupBoardBlobs(board)
    })

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
    boardsCache,
    myBoardIds,
    userBoardIds,
    currentBoardId,
    currentBoardPins,
    boardPinsPage,
    boardPinsTotal,
    isLoading,
    isLoadingPins,
    myBoards,
    currentBoard,
    getBoardById,
    getUserBoards,
    hasBoardPinsMore,
    fetchMyBoards,
    fetchUserBoards,
    fetchBoardById,
    fetchBoardPins,
    loadMoreBoardPins,
    createBoard,
    updateBoard,
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
  const selectedBoard = ref<Board | null>(null)
  const isLoading = ref(false)

  const hasSelectedBoard = computed(() => selectedBoard.value !== null)
  const selectedBoardId = computed(() => selectedBoard.value?.id || null)
  const selectedBoardTitle = computed(() => selectedBoard.value?.title || 'Profile')

  async function fetchSelectedBoard() {
    try {
      isLoading.value = true

      const board = await selectedBoardApi.getSelectedBoard()
      selectedBoard.value = board

      console.log('[SelectedBoard] Selected board loaded:', board)
      return board
    } catch (error) {
      console.log('[SelectedBoard] No board selected (this is normal)')
      selectedBoard.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function selectBoard(boardId: string) {
    try {
      isLoading.value = true

      await selectedBoardApi.selectBoard(boardId)
      await fetchSelectedBoard()

      console.log('[SelectedBoard] Board selected:', boardId)
    } catch (error) {
      console.error('[SelectedBoard] Failed to select board:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

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

  async function setBoard(board: Board | null) {
    if (board === null) {
      await deselectBoard()
    } else {
      await selectBoard(board.id)
    }
  }

  function clearSelectedBoard() {
    selectedBoard.value = null
  }

  return {
    selectedBoard,
    isLoading,
    hasSelectedBoard,
    selectedBoardId,
    selectedBoardTitle,
    fetchSelectedBoard,
    selectBoard,
    deselectBoard,
    setBoard,
    clearSelectedBoard,
  }
})
