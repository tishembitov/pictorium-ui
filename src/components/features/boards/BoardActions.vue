<!-- src/components/features/boards/BoardActions.vue -->
<script setup lang="ts">
/**
 * BoardActions - Действия над доской (edit, delete)
 */

import { ref } from 'vue'
import type { Board } from '@/types'

export interface BoardActionsProps {
  board: Board
  canEdit?: boolean
  canDelete?: boolean
  variant?: 'inline' | 'dropdown'
}

const props = withDefaults(defineProps<BoardActionsProps>(), {
  canEdit: false,
  canDelete: false,
  variant: 'inline',
})

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const showDropdown = ref(false)

const handleEdit = () => {
  emit('edit')
  showDropdown.value = false
}

const handleDelete = () => {
  emit('delete')
  showDropdown.value = false
}
</script>

<template>
  <!-- Inline Variant -->
  <div v-if="variant === 'inline'" class="flex items-center gap-2">
    <button
      v-if="canEdit"
      @click="handleEdit"
      class="px-3 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition text-sm"
    >
      Edit
    </button>
    <button
      v-if="canDelete"
      @click="handleDelete"
      class="px-3 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition text-sm"
    >
      Delete
    </button>
  </div>

  <!-- Dropdown Variant -->
  <div v-else class="relative">
    <button
      @click="showDropdown = !showDropdown"
      class="p-2 hover:bg-gray-100 rounded-full transition"
    >
      <i class="pi pi-ellipsis-h text-xl text-gray-600"></i>
    </button>

    <Transition name="dropdown">
      <div
        v-if="showDropdown"
        class="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px] z-10"
      >
        <button
          v-if="canEdit"
          @click="handleEdit"
          class="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2"
        >
          <i class="pi pi-pencil text-gray-600"></i>
          <span>Edit</span>
        </button>

        <button
          v-if="canDelete"
          @click="handleDelete"
          class="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition flex items-center gap-2"
        >
          <i class="pi pi-trash"></i>
          <span>Delete</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
