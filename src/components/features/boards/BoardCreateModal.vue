<!-- src/components/features/boards/BoardCreateModal.vue -->
<script setup lang="ts">
/**
 * BoardCreateModal - Модалка создания доски
 * ✅ ИСПРАВЛЕНО: async валидация с debounce
 */

import { computed, ref, watch } from 'vue'
import { useBoards } from '@/composables/api/useBoards'
import { useToast } from '@/composables/ui/useToast'
import { useDebouncedFn } from '@/composables/utils/useDebounce'
import { validators } from '@/composables/form/useFormValidation'

// ============ TYPES ============

export interface BoardCreateModalProps {
  modelValue: boolean
}

// ============ PROPS & EMITS ============

const props = defineProps<BoardCreateModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', boardId: string): void
}>()

// ============ COMPOSABLES ============

const { createBoard, isLoading } = useBoards()
const { success, error: showError } = useToast()

// ============ STATE ============

const boardName = ref('')
const validationError = ref<string | null>(null)
const isValidating = ref(false)

// ============ COMPUTED ============

const isValid = computed(
  () => !validationError.value && !isValidating.value && boardName.value.trim().length > 0,
)

const canSubmit = computed(
  () => isValid.value && !isLoading.value && boardName.value.trim().length > 0,
)

// ============ VALIDATION ============

// ✅ FIX: Async валидация с debounce
const { execute: debouncedValidate } = useDebouncedFn(async () => {
  const result = validators.boardTitle(boardName.value)

  // Обрабатываем как Promise, так и синхронное значение
  if (result instanceof Promise) {
    validationError.value = await result
  } else {
    validationError.value = result
  }

  isValidating.value = false
}, 300)

function handleInput(): void {
  isValidating.value = true
  debouncedValidate()
}

// Синхронная валидация перед отправкой (для мгновенной проверки)
async function validateBeforeSubmit(): Promise<boolean> {
  const result = validators.boardTitle(boardName.value)

  if (result instanceof Promise) {
    validationError.value = await result
  } else {
    validationError.value = result
  }

  return validationError.value === null
}

// ============ HANDLERS ============

function closeModal(): void {
  emit('update:modelValue', false)
  boardName.value = ''
  validationError.value = null
  isValidating.value = false
}

async function handleCreate(): Promise<void> {
  // Валидация перед отправкой
  const isValidForm = await validateBeforeSubmit()
  if (!isValidForm) return

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

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && canSubmit.value) {
    handleCreate()
  }
  if (event.key === 'Escape') {
    closeModal()
  }
}

// ============ WATCHERS ============

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      boardName.value = ''
      validationError.value = null
      isValidating.value = false
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-center justify-center bg-black/50 z-40 backdrop-blur-sm"
        @click.self="closeModal"
        @keydown="handleKeydown"
      >
        <div class="bg-white p-6 rounded-2xl shadow-lg w-96 max-w-full z-50 ml-20">
          <h2 class="text-xl font-bold mb-4 text-gray-800">Create Board</h2>

          <!-- Input -->
          <input
            v-model="boardName"
            type="text"
            placeholder="Board name"
            :class="[
              'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
              validationError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-red-500',
            ]"
            @input="handleInput"
          />

          <!-- Validation error -->
          <Transition name="slide-fade">
            <p v-if="validationError" class="text-red-500 text-sm mt-1">
              {{ validationError }}
            </p>
          </Transition>

          <!-- Validating indicator -->
          <p v-if="isValidating" class="text-gray-400 text-sm mt-1">Checking...</p>

          <!-- Buttons -->
          <div class="flex justify-end gap-3 mt-5">
            <button
              type="button"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canSubmit"
              @click="handleCreate"
            >
              {{ isLoading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
