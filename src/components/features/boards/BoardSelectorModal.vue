<!-- src/components/features/boards/BoardSelectorModal.vue -->
<script setup lang="ts">
/**
 * BoardSelectorModal - Модалка выбора доски для сохранения пина
 * Точный UI из старого PinView.vue
 */

import { computed } from 'vue'
import { useSelectedBoard } from '@/composables/api/useSelectedBoard'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import type { BoardWithPins } from '@/types'

export interface BoardSelectorModalProps {
  modelValue: boolean
  boards: BoardWithPins[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<BoardSelectorModalProps>(), {
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', boardId: string): void
  (e: 'selectProfile'): void
}>()

const { select, deselect } = useSelectedBoard()

function close() {
  emit('update:modelValue', false)
}

async function selectBoard(board: BoardWithPins) {
  await select(board.id)
  emit('select', board.id)
  close()
}

async function chooseProfile() {
  await deselect()
  emit('selectProfile')
  close()
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    size="lg"
    :show-header="false"
    :show-footer="false"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="min-h-[300px] flex items-center justify-center">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <div v-else class="p-6">
      <!-- Profile button -->
      <h2 class="text-xl font-semibold mb-4 text-center text-black">Choose where to save</h2>
      <div class="flex justify-center">
        <button
          @click="chooseProfile"
          class="w-1/2 px-6 py-3 text-md bg-gray-800 hover:bg-black text-white rounded-3xl transition cursor-pointer"
        >
          Profile
        </button>
      </div>

      <!-- Boards header -->
      <h2 class="text-xl font-semibold mb-4 mt-4 text-center text-black">Boards</h2>

      <!-- Boards grid -->
      <div class="columns-2 gap-4">
        <div
          v-for="board in boards"
          :key="board.id"
          class="mb-4 break-inside-avoid relative rounded-md cursor-pointer min-h-24 overflow-hidden transform transition-transform hover:scale-105"
          @click="selectBoard(board)"
        >
          <!-- Board title overlay -->
          <div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <h3
              class="text-3xl font-semibold text-white text-center px-4 py-2 bg-black/70 rounded-lg shadow-lg"
            >
              {{ board.title }}
            </h3>
          </div>

          <!-- Board pins preview -->
          <div class="columns-2 gap-1 relative z-0">
            <div
              v-for="(pin, index) in board.pins?.slice(0, 4)"
              :key="index"
              class="mb-2 break-inside-avoid"
            >
              <img
                v-if="pin.isImage"
                :src="pin.imageBlobUrl"
                :alt="pin.title || 'Pin'"
                class="w-full object-cover rounded-md"
              />
              <video
                v-else-if="pin.isVideo"
                :src="pin.videoBlobUrl"
                class="w-full object-cover rounded-md"
                autoplay
                loop
                muted
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
