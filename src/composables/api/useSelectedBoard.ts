// src/composables/api/useSelectedBoard.ts
import { computed } from 'vue'
import { useSelectedBoardStore } from '@/stores/boards.store'

export function useSelectedBoard() {
  const store = useSelectedBoardStore()

  const board = computed(() => store.selectedBoard)
  const hasSelected = computed(() => store.hasSelectedBoard)
  const isLoading = computed(() => store.isLoading)

  async function fetch() {
    return await store.fetchSelectedBoard()
  }

  async function select(boardId: string) {
    return await store.selectBoard(boardId)
  }

  async function deselect() {
    return await store.deselectBoard()
  }

  return {
    board,
    hasSelected,
    isLoading,
    fetch,
    select,
    deselect,
  }
}
