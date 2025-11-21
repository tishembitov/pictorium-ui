<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBoardSelector } from '@/composables/features/useBoardSelector'
import BoardSelectorModal from '@/components/features/board/BoardSelectorModal.vue'
import { useSelectedBoard } from '@/stores/selectedBoard.store'

export interface PinActionsProps {
  show: boolean
  pinId: string
  canDelete?: boolean
  canEdit?: boolean
}

const props = withDefaults(defineProps<PinActionsProps>(), {
  canDelete: false,
  canEdit: false,
})

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'delete'): void
  (e: 'like'): void
}>()

const selectedBoardStore = useSelectedBoard()
const showBoardSelector = ref(false)

// Save button state
const saveState = ref<'save' | 'saving' | 'saved' | 'error'>('save')
const deleteState = ref<'delete' | 'deleting' | 'deleted'>('delete')

const saveText = computed(() => {
  const texts = {
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'U already saved!',
  }
  return texts[saveState.value]
})

const saveBgClass = computed(() => {
  return saveState.value === 'save' ? 'bg-red-600' : 'bg-black'
})

const deleteText = computed(() => {
  const texts = {
    delete: 'Delete',
    deleting: 'Deleting...',
    deleted: 'Deleted',
  }
  return texts[deleteState.value]
})

const selectedBoardText = computed(() => {
  return selectedBoardStore.selectedBoard ? selectedBoardStore.selectedBoard.title : 'Profile'
})

const handleSave = () => {
  saveState.value = 'saving'
  emit('save')
  // Reset after 2s
  setTimeout(() => {
    saveState.value = 'save'
  }, 2000)
}

const handleDelete = () => {
  deleteState.value = 'deleting'
  emit('delete')
}

const openBoardSelector = () => {
  showBoardSelector.value = true
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="absolute inset-0 z-10">
      <!-- Save Button -->
      <button
        @click.stop="handleSave"
        :class="[
          'absolute top-2 right-2 px-6 py-3 text-sm text-white rounded-3xl transition',
          saveBgClass,
          'hover:bg-red-700',
        ]"
      >
        {{ saveText }}
      </button>

      <!-- Board Selector Button -->
      <button
        @click.stop="openBoardSelector"
        class="absolute top-14 right-2 px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition"
      >
        {{ selectedBoardText }}
      </button>

      <!-- Delete Button -->
      <button
        v-if="canDelete"
        @click.stop="handleDelete"
        class="absolute top-2 left-2 px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition"
      >
        {{ deleteText }}
      </button>
    </div>
  </Transition>

  <!-- Board Selector Modal -->
  <BoardSelectorModal v-model="showBoardSelector" :pin-id="pinId" @select="handleSave" />
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
