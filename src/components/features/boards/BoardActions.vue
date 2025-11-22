<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useConfirm } from '@/composables/ui/useConfirm'
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

const { confirmDelete } = useConfirm()

const showDropdown = ref(false)

const handleEdit = () => {
  emit('edit')
  showDropdown.value = false
}

const handleDelete = async () => {
  const confirmed = await confirmDelete('board', props.board.title)
  if (confirmed) {
    emit('delete')
  }
  showDropdown.value = false
}
</script>

<template>
  <!-- Inline Variant -->
  <div v-if="variant === 'inline'" class="flex items-center gap-2">
    <BaseButton v-if="canEdit" variant="outline" size="sm" @click="handleEdit">
      <template #icon>
        <i class="pi pi-pencil"></i>
      </template>
      Edit
    </BaseButton>

    <BaseButton v-if="canDelete" variant="danger" size="sm" @click="handleDelete">
      <template #icon>
        <i class="pi pi-trash"></i>
      </template>
      Delete
    </BaseButton>
  </div>

  <!-- Dropdown Variant -->
  <div v-else-if="variant === 'dropdown'" class="relative">
    <button
      @click="showDropdown = !showDropdown"
      class="p-2 hover:bg-gray-100 rounded-full transition"
    >
      <i class="pi pi-ellipsis-h text-xl"></i>
    </button>

    <Transition name="fade">
      <div
        v-if="showDropdown"
        v-click-outside="() => (showDropdown = false)"
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
