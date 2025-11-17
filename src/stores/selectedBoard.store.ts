// src/stores/selectedBoard.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BoardResponse } from '@/types/api.types'
import { selectedBoardApi } from '@/api/boards.api'

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
      return board
    } catch (error) {
      // Если доска не выбрана - это норма
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
      // (можно загрузить полную инфу о доске)
      await fetchSelectedBoard()
    } catch (error) {
      console.error('Failed to select board:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Сброс выбранной доски
   */
  async function deselectBoard() {
    try {
      isLoading.value = true
      await selectedBoardApi.deselectBoard()
      selectedBoard.value = null
    } catch (error) {
      console.error('Failed to deselect board:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Установка доски (с выбором через API)
   */
  async function setBoard(board: BoardResponse | null) {
    if (board === null) {
      await deselectBoard()
    } else {
      await selectBoard(board.id)
    }
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
  }
})
