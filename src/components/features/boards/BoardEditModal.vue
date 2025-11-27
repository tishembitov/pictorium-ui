<!-- src/components/features/boards/BoardEditModal.vue -->
<script setup lang="ts">
/**
 * BoardEditModal - Редактирование доски
 *
 * Стиль соответствует BoardCreateModal
 */

import { ref, watch } from 'vue'
import type { Board } from '@/types'
import { useBoards, useToast } from '@/composables'

export interface BoardEditModalProps {
  modelValue: boolean
  board: Board | null
}

const props = defineProps<BoardEditModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', board: Board): void
}>()

const { updateBoard } = useBoards()
const { success, error: showError } = useToast()

const boardName = ref('')
const isLoading = ref(false)

// Sync with board prop
watch(
  () => props.board,
  (board) => {
    if (board) {
      boardName.value = board.title
    }
  },
  { immediate: true },
)

// Reset on close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen && props.board) {
      boardName.value = props.board.title
    }
  },
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSave = async () => {
  if (!props.board || !boardName.value.trim()) return

  // Если название не изменилось - просто закрываем
  if (boardName.value.trim() === props.board.title) {
    closeModal()
    return
  }

  try {
    isLoading.value = true

    const updated = await updateBoard(props.board.id, boardName.value.trim())

    success('Board updated!')
    emit('updated', updated)
    closeModal()
  } catch (e) {
    showError('Failed to update board')
    console.error('[BoardEditModal] Update failed:', e)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div class="bg-white p-6 rounded-2xl shadow-lg w-96 max-w-full z-50 ml-20">
      <h2 class="text-xl font-bold mb-4 text-gray-800">Edit Board</h2>

      <input
        type="text"
        v-model="boardName"
        placeholder="Board name"
        class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
        @keydown.enter="handleSave"
      />

      <div class="flex justify-end gap-3 mt-5">
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          class="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          :disabled="isLoading || !boardName.trim()"
        >
          {{ isLoading ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>
