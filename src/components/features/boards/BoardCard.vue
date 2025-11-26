<!-- src/components/features/boards/BoardCard.vue -->
<script setup lang="ts">
/**
 * BoardCard - Карточка доски с превью пинов
 *
 * ✅ Визуальный стиль из старого Boards.vue:
 * - border-4 border-red-600 при selected
 * - gap-1 между превью
 * - bg-black bg-opacity-70 для title
 */

import { computed } from 'vue'
import type { BoardWithPins, PinWithBlob } from '@/types'

export interface BoardCardProps {
  board: BoardWithPins
  selected?: boolean
  canEdit?: boolean
  variant?: 'grid' | 'selector'
}

const props = withDefaults(defineProps<BoardCardProps>(), {
  selected: false,
  canEdit: false,
  variant: 'grid',
})

const emit = defineEmits<{
  (e: 'click', board: BoardWithPins): void
  (e: 'delete', boardId: string): void
}>()

// Вычисляем layout на основе количества пинов
const layoutVariant = computed(() => {
  const count = props.board.pins?.length || 0
  if (count === 0) return 'empty'
  if (count === 1) return 'single'
  if (count === 2) return 'double'
  if (count === 3) return 'triple'
  return 'quad'
})

const previewPins = computed(() => props.board.pins?.slice(0, 4) || [])

const handleClick = () => {
  emit('click', props.board)
}

const handleDelete = (event: Event) => {
  event.stopPropagation()
  emit('delete', props.board.id)
}

// Helper для определения типа медиа
const isImage = (pin: PinWithBlob) => pin.isImage !== false && pin.imageBlobUrl
const isVideo = (pin: PinWithBlob) => pin.isVideo || pin.videoBlobUrl
</script>

<template>
  <div
    @click="handleClick"
    :class="[
      'rounded-2xl transition transform cursor-pointer hover:scale-105 overflow-hidden w-full h-48 relative',
      selected && 'border-4 border-red-600',
    ]"
  >
    <!-- Empty State -->
    <template v-if="layoutVariant === 'empty'">
      <div class="flex items-center justify-center w-full h-full bg-black">
        <h3 class="bg-black bg-opacity-70 text-white text-lg font-bold px-4 py-2 rounded">
          {{ board.title }}
        </h3>
      </div>
    </template>

    <!-- Single Pin - на весь контейнер -->
    <template v-else-if="layoutVariant === 'single'">
      <div class="w-full h-full">
        <img
          v-if="isImage(previewPins[0]!)"
          :src="previewPins[0]!.imageBlobUrl"
          alt="Pin"
          class="object-cover w-full h-full"
        />
        <video
          v-else-if="isVideo(previewPins[0]!)"
          :src="previewPins[0]!.videoBlobUrl || previewPins[0]!.imageBlobUrl"
          alt="Pin"
          class="object-cover w-full h-full"
          autoplay
          loop
          muted
        />
      </div>
    </template>

    <!-- Double Pins - Grid 1x2 -->
    <template v-else-if="layoutVariant === 'double'">
      <div class="w-full h-full grid grid-cols-2 gap-1">
        <div v-for="(pin, index) in previewPins.slice(0, 2)" :key="index">
          <img
            v-if="isImage(pin)"
            :src="pin.imageBlobUrl"
            alt="Pin"
            class="object-cover w-full h-full"
          />
          <video
            v-else-if="isVideo(pin)"
            :src="pin.videoBlobUrl || pin.imageBlobUrl"
            alt="Pin"
            class="object-cover w-full h-full"
            autoplay
            loop
            muted
          />
        </div>
      </div>
    </template>

    <!-- Triple Pins - 1 сверху + 2 снизу -->
    <template v-else-if="layoutVariant === 'triple'">
      <div class="w-full h-full grid grid-rows-2 gap-1">
        <!-- Верхняя строка: 1 пин на всю ширину -->
        <div class="w-full h-full">
          <img
            v-if="isImage(previewPins[0]!)"
            :src="previewPins[0]!.imageBlobUrl"
            alt="Pin"
            class="object-cover w-full h-full"
          />
          <video
            v-else-if="isVideo(previewPins[0]!)"
            :src="previewPins[0]!.videoBlobUrl || previewPins[0]!.imageBlobUrl"
            alt="Pin"
            class="object-cover w-full h-full"
            autoplay
            loop
            muted
          />
        </div>
        <!-- Нижняя строка: 2 пина -->
        <div class="w-full h-full grid grid-cols-2 gap-1">
          <div v-for="(pin, index) in previewPins.slice(1, 3)" :key="index">
            <img
              v-if="isImage(pin)"
              :src="pin.imageBlobUrl"
              alt="Pin"
              class="object-cover w-full h-full"
            />
            <video
              v-else-if="isVideo(pin)"
              :src="pin.videoBlobUrl || pin.imageBlobUrl"
              alt="Pin"
              class="object-cover w-full h-full"
              autoplay
              loop
              muted
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Quad Pins - Grid 2x2 -->
    <template v-else>
      <div class="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
        <div v-for="(pin, index) in previewPins.slice(0, 4)" :key="index" class="relative">
          <img
            v-if="isImage(pin)"
            :src="pin.imageBlobUrl"
            alt="Pin"
            class="object-cover w-full h-full"
          />
          <video
            v-else-if="isVideo(pin)"
            :src="pin.videoBlobUrl || pin.imageBlobUrl"
            alt="Pin"
            class="object-cover w-full h-full"
            autoplay
            loop
            muted
          />
        </div>
      </div>
    </template>

    <!-- Title Overlay - центрированный (из старого проекта) -->
    <div
      v-if="layoutVariant !== 'empty'"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <h3
        :class="[
          'bg-black bg-opacity-70 text-white text-lg font-bold px-4 py-2 rounded',
          selected && 'border-4 border-red-600',
        ]"
      >
        {{ board.title }}
      </h3>
    </div>

    <!-- Delete Button (из старого проекта) -->
    <div v-if="canEdit" class="absolute top-2 right-2">
      <button
        @click="handleDelete"
        class="px-3 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
      >
        Delete
      </button>
    </div>
  </div>
</template>
