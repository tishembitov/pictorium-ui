<!-- src/components/features/boards/BoardCreateModal.vue -->
<script setup lang="ts">
/**
 * BoardCreateModal - Модалка создания доски
 *
 * ✅ Точный UI из старого Boards.vue (showAddBoard секция)
 */

import { ref, watch } from 'vue'
import { useBoards } from '@/composables/api/useBoards'
import { useToast } from '@/composables/ui/useToast'

export interface BoardCreateModalProps {
  modelValue: boolean
}

const props = defineProps<BoardCreateModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', boardId: string): void
}>()

const { createBoard, isLoading } = useBoards()
const { success, error: showError } = useToast()

const boardName = ref('')

// Reset on close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      boardName.value = ''
    }
  },
)

const closeModal = () => {
  emit('update:modelValue', false)
  boardName.value = ''
}

const handleCreate = async () => {
  if (!boardName.value.trim()) return

  try {
    const board = await createBoard(boardName.value.trim())
    success('Board created!')
    emit('created', board.id)
    closeModal()
  } catch (e) {
    showError('Failed to create board')
    console.error('[BoardCreateModal] Create failed:', e)
  }
}
</script>

<template>
  <!-- Backdrop (точно как в старом Boards.vue) -->
  <div
    v-if="modelValue"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div class="bg-white p-6 rounded-2xl shadow-lg w-96 max-w-full z-50 ml-20">
      <h2 class="text-xl font-bold mb-4 text-gray-800">Create Board</h2>

      <!-- Input (точно как в старом проекте) -->
      <input
        type="text"
        v-model="boardName"
        placeholder="Board name"
        class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
        @keydown.enter="handleCreate"
      />

      <!-- Buttons (точно как в старом проекте) -->
      <div class="flex justify-end gap-3 mt-5">
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button
          @click="handleCreate"
          class="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          :disabled="isLoading || !boardName.trim()"
        >
          {{ isLoading ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
</template>
