<!-- src/components/features/boards/BoardList.vue -->
<script setup lang="ts">
/**
 * BoardList - Список досок с FAB кнопкой создания
 *
 * ✅ Использует BaseLoader вместо inline стилей
 */

import { ref, computed, onMounted, watch } from 'vue'
import BoardGrid from './BoardGrid.vue'
import BoardCard from './BoardCard.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import { useBoards } from '@/composables'
import { useToast } from '@/composables/ui/useToast'
import type { BoardWithPins } from '@/types'

export interface BoardListProps {
  userId?: string
  variant?: 'my' | 'user'
  canEdit?: boolean
  selectable?: boolean
  showCreateButton?: boolean
  columns?: 1 | 2 | 3 | 4 | 5
  selectedBoardId?: string | null
}

const props = withDefaults(defineProps<BoardListProps>(), {
  variant: 'my',
  canEdit: false,
  selectable: false,
  showCreateButton: false,
  columns: 5,
  selectedBoardId: null,
})

const emit = defineEmits<{
  (e: 'select', board: BoardWithPins): void
  (e: 'delete', boardId: string): void
  (e: 'create'): void
}>()

const { myBoards, fetchMyBoards, fetchUserBoards, deleteBoard, isLoading } = useBoards()

const { success, error: showError } = useToast()

const boards = computed(() => myBoards.value)
const isEmpty = computed(() => !isLoading.value && boards.value.length === 0)

// Load boards
onMounted(async () => {
  if (props.variant === 'my') {
    await fetchMyBoards()
  } else if (props.userId) {
    await fetchUserBoards(props.userId)
  }
})

// Reload on userId change
watch(
  () => props.userId,
  async (newUserId) => {
    if (props.variant === 'user' && newUserId) {
      await fetchUserBoards(newUserId)
    }
  },
)

const handleBoardClick = (board: BoardWithPins) => {
  emit('select', board)
}

const handleDelete = async (boardId: string) => {
  try {
    await deleteBoard(boardId)
    success('Board deleted!')
    emit('delete', boardId)
  } catch (e) {
    showError('Failed to delete board')
    console.error('[BoardList] Delete failed:', e)
  }
}

const handleCreate = () => {
  emit('create')
}
</script>

<template>
  <div class="mt-10 ml-20">
    <!-- ✅ Использует BaseLoader -->
    <BaseLoader v-if="isLoading" variant="colorful" size="md" />

    <div v-else>
      <!-- FAB Create Button -->
      <div
        v-if="showCreateButton && canEdit"
        class="fixed bottom-6 transform items-center justify-center left-1/2 z-20 ml-7 text-4xl"
      >
        <button
          @click="handleCreate"
          class="bg-white/80 font-medium rounded-full px-4 py-2 flex justify-center items-center transition-transform duration-300 hover:bg-gray-200 hover:opacity-100 hover:scale-105"
        >
          +
        </button>
      </div>

      <!-- Boards Grid -->
      <BoardGrid :columns="columns" :gap="2">
        <BoardCard
          v-for="board in boards"
          :key="board.id"
          :board="board"
          :selected="board.id === selectedBoardId"
          :can-edit="canEdit"
          @click="handleBoardClick"
          @delete="handleDelete"
        />
      </BoardGrid>

      <!-- Empty State -->
      <div v-if="isEmpty">
        <section class="text-center flex flex-col justify-center items-center relative">
          <h1 class="text-2xl font-bold mb-4">no boards</h1>
          <img
            class="h-72 rounded-xl"
            src="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
            alt="not found image"
          />
        </section>
      </div>
    </div>
  </div>
</template>
