<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BoardGrid from './BoardGrid.vue'
import BoardCard from './BoardCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useBoards } from '@/composables/api/useBoards'
import { useSelectedBoardStore } from '@/stores/selectedBoard.store'
import { useToast } from '@/composables/ui/useToast'
import type { Board } from '@/types'

export interface BoardListProps {
  userId?: string
  variant?: 'my' | 'user'
  canEdit?: boolean
  selectable?: boolean
  showCreateButton?: boolean
  columns?: 1 | 2 | 3 | 4 | 5
}

const props = withDefaults(defineProps<BoardListProps>(), {
  variant: 'my',
  canEdit: false,
  selectable: false,
  showCreateButton: false,
  columns: 5,
})

const emit = defineEmits<{
  (e: 'boardClick', board: Board): void
  (e: 'boardDeleted', boardId: string): void
  (e: 'createBoard'): void
}>()

const { myBoards, fetchMyBoards, fetchUserBoards, deleteBoard, isLoading } = useBoards()
const selectedBoardStore = useSelectedBoardStore()
const { showToast } = useToast()

const boards = computed(() => myBoards.value)

onMounted(async () => {
  if (props.variant === 'my') {
    await fetchMyBoards()
  } else if (props.userId) {
    await fetchUserBoards(props.userId)
  }
})

const handleBoardClick = (board: Board) => {
  if (props.selectable) {
    selectedBoardStore.setBoard(board)
  }
  emit('boardClick', board)
}

const handleDelete = async (boardId: string) => {
  try {
    await deleteBoard(boardId)
    showToast('Board deleted successfully!', 'success')
    emit('boardDeleted', boardId)
  } catch (error) {
    console.error('[BoardList] Delete failed:', error)
    showToast('Failed to delete board', 'error')
  }
}

const handleCreate = () => {
  emit('createBoard')
}

const isSelected = (boardId: string) => {
  return props.selectable && selectedBoardStore.selectedBoard?.id === boardId
}
</script>

<template>
  <div class="relative">
    <!-- Create Button -->
    <button
      v-if="showCreateButton && canEdit"
      @click="handleCreate"
      class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 ml-7 text-4xl bg-white/80 hover:bg-gray-200 hover:scale-105 font-medium rounded-full px-4 py-2 flex justify-center items-center transition-all duration-300 shadow-lg"
    >
      +
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-full p-2">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="boards.length === 0"
      title="No boards"
      message="Create your first board to organize pins"
      image="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
    >
      <template v-if="canEdit" #action>
        <BaseButton variant="primary" @click="handleCreate">
          <template #icon>
            <i class="pi pi-plus"></i>
          </template>
          Create Board
        </BaseButton>
      </template>
    </EmptyState>

    <!-- Boards Grid -->
    <BoardGrid v-else :columns="columns" :gap="2">
      <BoardCard
        v-for="board in boards"
        :key="board.id"
        :board="board"
        :selected="isSelected(board.id)"
        :can-edit="canEdit"
        :clickable="true"
        @click="handleBoardClick(board)"
        @delete="handleDelete"
      />
    </BoardGrid>
  </div>
</template>
