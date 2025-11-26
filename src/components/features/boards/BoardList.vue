<!-- src/components/features/boards/BoardList.vue -->
<script setup lang="ts">
/**
 * BoardList - Список досок с FAB кнопкой создания
 *
 * ✅ Визуальный стиль из старого Boards.vue:
 * - FAB кнопка fixed bottom-6 left-1/2
 * - loader2 анимация
 * - Empty state с изображением
 */

import { ref, computed, onMounted, watch } from 'vue'
import BoardGrid from './BoardGrid.vue'
import BoardCard from './BoardCard.vue'
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
    <!-- Loading (loader2 из старого проекта) -->
    <div v-if="isLoading" class="flex items-center justify-center h-full p-2">
      <span class="text-center loader2"></span>
    </div>

    <div v-else>
      <!-- FAB Create Button (из старого проекта) -->
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

      <!-- Empty State (из старого проекта) -->
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

<style scoped>
/* loader2 из старого проекта */
.loader2 {
  width: 48px;
  height: 48px;
  background: #fff;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

.loader2::after {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 6px;
  top: 10px;
  width: 12px;
  height: 12px;
  color: #ff3d00;
  background: currentColor;
  border-radius: 50%;
  box-shadow:
    25px 2px,
    10px 22px;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
