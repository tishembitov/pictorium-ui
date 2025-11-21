<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import { useBoards } from '@/composables/api/useBoards'
import { useSelectedBoard } from '@/stores/selectedBoard.store'
import type { Board } from '@/types'

export interface BoardSelectorModalProps {
  modelValue: boolean
  pinId: string
}

const props = defineProps<BoardSelectorModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', board: Board | null): void
}>()

const { fetchMyBoards, addPinToBoard } = useBoards()
const selectedBoardStore = useSelectedBoard()

const boards = ref<Board[]>([])
const isLoading = ref(false)

// Load boards when modal opens
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
    console.error('[BoardSelectorModal] Load failed:', error)
  } finally {
    isLoading.value = false
  }
}

const selectProfile = () => {
  selectedBoardStore.setBoard(null)
  emit('select', null)
  emit('update:modelValue', false)
}

const selectBoard = async (board: Board) => {
  try {
    await addPinToBoard(board.id, props.pinId)
    selectedBoardStore.setBoard(board)
    emit('select', board)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('[BoardSelectorModal] Select failed:', error)
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Choose where to save"
    size="md"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-4">
      <!-- Profile Option -->
      <BaseButton variant="secondary" full-width @click="selectProfile">
        Save to Profile
      </BaseButton>

      <!-- Boards Title -->
      <h3 class="text-lg font-semibold text-center">Your Boards</h3>

      <!-- Boards Grid -->
      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="board in boards"
          :key="board.id"
          @click="selectBoard(board)"
          class="relative rounded-lg overflow-hidden hover:scale-105 transition-transform group"
        >
          <!-- Board title overlay -->
          <div class="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
            <h4 class="text-white font-semibold text-lg px-4 text-center">
              {{ board.title }}
            </h4>
          </div>

          <!-- Placeholder -->
          <div class="aspect-square bg-gray-200"></div>
        </button>
      </div>
    </div>
  </BaseModal>
</template>
