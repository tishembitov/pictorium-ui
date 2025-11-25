// src/composables/api/useBoardDetail.ts
/**
 * useBoardDetail - Composable для страницы доски
 */

import { computed, onUnmounted } from 'vue'
import { useBoardsStore } from '@/stores/boards.store'
import type { BoardWithPins, PinWithBlob } from '@/types'

export function useBoardDetail(boardId: string | (() => string)) {
  const boardsStore = useBoardsStore()

  const getId = () => (typeof boardId === 'string' ? boardId : boardId())

  // ============ REACTIVE DATA ============

  const board = computed<BoardWithPins | null>(() => boardsStore.getBoardById(getId()) || null)

  const pins = computed<PinWithBlob[]>(() => boardsStore.currentBoardPins)

  const hasMore = computed(() => boardsStore.hasBoardPinsMore)
  const isLoading = computed(() => boardsStore.isLoading)
  const isLoadingPins = computed(() => boardsStore.isLoadingPins)

  // ============ ACTIONS ============

  async function fetchBoard(forceReload = false) {
    return await boardsStore.fetchBoardById(getId(), forceReload)
  }

  async function fetchPins(page = 0, size = 15) {
    return await boardsStore.fetchBoardPins(getId(), page, size)
  }

  async function loadMorePins() {
    return await boardsStore.loadMoreBoardPins()
  }

  async function addPin(pinId: string) {
    return await boardsStore.addPinToBoard(getId(), pinId)
  }

  async function removePin(pinId: string) {
    return await boardsStore.removePinFromBoard(getId(), pinId)
  }

  async function deleteBoard() {
    return await boardsStore.deleteBoard(getId())
  }

  function cleanup() {
    boardsStore.clearCurrentBoard()
  }

  onUnmounted(cleanup)

  return {
    board,
    pins,
    hasMore,
    isLoading,
    isLoadingPins,
    fetchBoard,
    fetchPins,
    loadMorePins,
    addPin,
    removePin,
    deleteBoard,
    cleanup,
  }
}

/**
 * useMyBoards - Мои доски (для селектора)
 */
export function useMyBoards() {
  const boardsStore = useBoardsStore()

  const boards = computed(() => boardsStore.myBoards)
  const isLoading = computed(() => boardsStore.isLoading)

  async function fetch(forceReload = false) {
    return await boardsStore.fetchMyBoards(forceReload)
  }

  async function create(title: string) {
    return await boardsStore.createBoard(title)
  }

  return {
    boards,
    isLoading,
    fetch,
    create,
  }
}
