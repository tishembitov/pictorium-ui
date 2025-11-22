<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BoardCard from './BoardCard.vue'
import { useBoards } from '@/composables/api/useBoards'
import { useSelectedBoardStore } from '@/stores/selectedBoard.store'
import { useToast } from '@/composables/ui/useToast'
import type { Board } from '@/types'

export interface BoardSelectorProps {
  modelValue: boolean
  pinId: string
  showProfileOption?: boolean
}

const props = withDefaults(defineProps<BoardSelectorProps>(), {
  showProfileOption: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', board: Board | null): void
}>()

const { fetchMyBoards, addPinToBoard } = useBoards()
const selectedBoardStore = useSelectedBoardStore()
const { showToast } = useToast()

const boards = ref<Board[]>([])
const isLoading = ref(false)

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && boards.value.length === 0) {
      await loadBoards()
    }
  },
)

const loadBoards = async () => {
  try {
    isLoading.value = true
    boards.value = await fetchMyBoards()
  } catch (error) {
    console.error('[BoardSelector] Load failed:', error)
    showToast('Failed to load boards', 'error')
  } finally {
    isLoading.value = false
  }
}

const selectProfile = async () => {
  try {
    // ✅ FIX: добавляем пин на профиль (без доски)
    await addPinToBoard('profile', props.pinId) // API должен поддерживать 'profile' или null

    selectedBoardStore.setBoard(null)
    emit('select', null)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('[BoardSelector] Save to profile failed:', error)
    showToast('Failed to save to profile', 'error')
  }
}

const selectBoard = async (board: Board) => {
  try {
    await addPinToBoard(board.id, props.pinId)

    selectedBoardStore.setBoard(board)
    emit('select', board)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('[BoardSelector] Select board failed:', error)
    showToast('Failed to save to board', 'error')
  }
}

const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Choose where to save"
    size="lg"
    @close="close"
  >
    <div v-if="isLoading" class="flex justify-center py-8">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <div v-else class="space-y-4">
      <div v-if="showProfileOption" class="flex justify-center">
        <BaseButton variant="secondary" size="md" full-width @click="selectProfile">
          Save to Profile
        </BaseButton>
      </div>

      <h3 class="text-lg font-semibold text-center">Your Boards</h3>

      <EmptyState
        v-if="boards.length === 0"
        title="No boards yet"
        message="Create your first board to organize pins"
        icon="pi-folder-open"
      />

      <div v-else class="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        <BoardCard
          v-for="board in boards"
          :key="board.id"
          :board="board"
          variant="selector"
          :clickable="true"
          @click="selectBoard(board)"
        />
      </div>
    </div>
  </BaseModal>
</template>
