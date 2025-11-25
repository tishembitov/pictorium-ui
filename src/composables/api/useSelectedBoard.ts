// src/composables/api/useSelectedBoard.ts
/**
 * useSelectedBoard - Выбранная доска для сохранения пинов
 */

import { computed } from 'vue'
import { useSelectedBoardStore } from '@/stores/boards.store'
import type { Board } from '@/types'

export function useSelectedBoard() {
  const store = useSelectedBoardStore()

  return {
    // State
    board: computed(() => store.selectedBoard),
    hasSelected: computed(() => store.hasSelectedBoard),
    boardId: computed(() => store.selectedBoardId),
    boardTitle: computed(() => store.selectedBoardTitle),
    isLoading: computed(() => store.isLoading),

    // Actions
    fetch: () => store.fetchSelectedBoard(),
    select: (boardId: string) => store.selectBoard(boardId),
    deselect: () => store.deselectBoard(),
    set: (board: Board | null) => store.setBoard(board),
  }
}
