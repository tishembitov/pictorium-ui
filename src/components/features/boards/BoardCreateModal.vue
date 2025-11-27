<!-- src/components/features/boards/BoardCreateModal.vue -->
<script setup lang="ts">
/**
 * BoardCreateModal - Модалка создания доски
 *
 * ✅ Точный UI из старого Boards.vue (showAddBoard секция)
 */

import { computed, ref, watch } from 'vue'
import { useBoards } from '@/composables/api/useBoards'
import { useToast } from '@/composables/ui/useToast'
import { validators } from '@/composables/form/useFormValidation'

export interface BoardCreateModalProps {
  modelValue: boolean
}

const props = defineProps<BoardCreateModalProps>()

const validationError = ref<string | null>(null)

const validateInput = () => {
  validationError.value = validators.boardTitle(boardName.value)
}

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', boardId: string): void
}>()

const { createBoard, isLoading } = useBoards()
const { success, error: showError } = useToast()
const isValid = computed(() => !validationError.value && boardName.value.trim().length > 0)

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
  validateInput()
  if (validationError.value) return

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
        @input="validateInput"
        placeholder="Board name"
        :class="[
          'w-full p-3 border rounded-lg focus:outline-none focus:ring-2',
          validationError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-red-500',
        ]"
        @keydown.enter="handleCreate"
      />

      <p v-if="validationError" class="text-red-500 text-sm mt-1">
        {{ validationError }}
      </p>

      <!-- Buttons (точно как в старом проекте) -->
      <div class="flex justify-end gap-3 mt-5">
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
          :disabled="isLoading || !isValid"
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
