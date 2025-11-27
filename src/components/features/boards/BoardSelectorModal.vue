<!-- src/components/features/boards/BoardSelectorModal.vue -->
<script setup lang="ts">
/**
 * BoardSelectorModal - Модалка выбора доски для сохранения пина
 *
 * ✅ Использует BaseLoader
 * ✅ Использует типизированные helpers
 */

import { watch } from 'vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import { useBoards } from '@/composables/api/useBoards'
import type { BoardWithPins, PinWithBlob } from '@/types'

export interface BoardSelectorModalProps {
  modelValue: boolean
}

const props = defineProps<BoardSelectorModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', boardId: string): void
  (e: 'selectProfile'): void
}>()

const { myBoards, fetchMyBoards, selectBoard, deselectBoard, isLoading } = useBoards()

// Load boards when modal opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await fetchMyBoards(true)
    }
  },
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSelectBoard = async (board: BoardWithPins) => {
  await selectBoard(board.id)
  emit('select', board.id)
  closeModal()
}

const handleSelectProfile = async () => {
  await deselectBoard()
  emit('selectProfile')
  closeModal()
}

/**
 * ✅ ИСПРАВЛЕНО: Типизированные helpers
 */
const hasImageContent = (pin: PinWithBlob): boolean => {
  return pin.isImage === true && !!pin.imageBlobUrl
}

const hasVideoContent = (pin: PinWithBlob): boolean => {
  return pin.isVideo === true && !!(pin.videoBlobUrl || pin.imageBlobUrl)
}

const getMediaUrl = (pin: PinWithBlob): string | undefined => {
  if (hasVideoContent(pin)) {
    return pin.videoBlobUrl || pin.imageBlobUrl
  }
  return pin.imageBlobUrl
}
</script>

<template>
  <div
    v-if="modelValue"
    class="z-50 fixed inset-0 bg-black/50 flex items-center justify-center px-4"
    @click.self="closeModal"
  >
    <!-- ✅ Loading state с BaseLoader -->
    <div
      v-if="isLoading"
      class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg max-w-2xl w-full relative backdrop-blur-lg overflow-auto max-h-screen min-h-[300px] flex items-center justify-center"
    >
      <BaseLoader variant="colorful" size="md" />
    </div>

    <!-- Content -->
    <div
      v-else
      class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg max-w-2xl w-full relative backdrop-blur-lg overflow-auto max-h-screen"
    >
      <!-- Profile button -->
      <h2 class="text-xl font-semibold mb-4 text-center text-black">Choose where to save</h2>
      <div class="flex justify-center">
        <button
          @click="handleSelectProfile"
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
          v-for="board in myBoards"
          :key="board.id"
          class="mb-4 break-inside-avoid relative rounded-md cursor-pointer min-h-24 overflow-hidden transform transition-transform hover:scale-105"
          @click="handleSelectBoard(board)"
        >
          <!-- Центрированный заголовок с тёмным фоном -->
          <div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <h3
              class="text-3xl font-semibold text-white text-center px-4 py-2 bg-black/70 rounded-lg shadow-lg"
            >
              {{ board.title }}
            </h3>
          </div>

          <!-- Витрина пинов -->
          <div class="columns-2 gap-1 relative z-0">
            <div
              v-for="(pin, index) in board.pins?.slice(0, 4)"
              :key="index"
              class="mb-2 break-inside-avoid"
            >
              <img
                v-if="hasImageContent(pin)"
                :src="pin.imageBlobUrl"
                :alt="pin.title || 'Pin'"
                class="w-full object-cover rounded-md"
              />
              <video
                v-else-if="hasVideoContent(pin)"
                :src="getMediaUrl(pin)"
                :alt="pin.title || 'Pin'"
                class="w-full object-cover rounded-md"
                autoplay
                loop
                muted
              />
            </div>
          </div>

          <!-- Empty board fallback -->
          <div
            v-if="!board.pins?.length"
            class="h-24 bg-gray-800 flex items-center justify-center rounded-md"
          >
            <span class="text-white text-xl font-semibold">{{ board.title }}</span>
          </div>
        </div>
      </div>

      <!-- No boards -->
      <div v-if="myBoards.length === 0" class="text-center py-8 text-gray-500">
        <p>You don't have any boards yet</p>
      </div>
    </div>
  </div>
</template>
