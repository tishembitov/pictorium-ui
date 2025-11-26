<!-- src/components/features/boards/BoardPins.vue -->
<script setup lang="ts">
/**
 * BoardPins - Пины доски с Masonry layout
 *
 * ✅ Визуальный стиль из старого PinsByBoard.vue:
 * - v-masonry с transition-duration="0.4s"
 * - Batch loading (showAllPins per group)
 * - Placeholder с rgb цветом
 * - w-1/5 для карточек
 */

import { ref, computed, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { useBoardPins } from '@/composables/api/useBoards'
import type { PinWithBlob } from '@/types'

export interface BoardPinsProps {
  boardId: string
  boardName?: string
  canEdit?: boolean
}

const props = withDefaults(defineProps<BoardPinsProps>(), {
  canEdit: false,
})

const emit = defineEmits<{
  (e: 'pinClick', pin: PinWithBlob): void
  (e: 'pinRemove', pinId: string): void
}>()

const { pins, hasMore, isLoading, fetch, loadMore, removePin, cleanup } = useBoardPins(
  () => props.boardId,
)

// Tracking для batch loading (как в старом проекте)
const cntLoading = ref(0)
const limitCntLoading = ref<number | null>(null)
const showNoPins = ref(false)

interface PinGroup {
  pins: PinWithBlob[]
  showAllPins: boolean
}

const pinGroups = ref<PinGroup[]>([])

// Scroll handler
const handleScroll = () => {
  const scrollableHeight = document.documentElement.scrollHeight
  const currentScrollPosition = window.innerHeight + window.scrollY

  if (currentScrollPosition + 200 >= scrollableHeight) {
    handleLoadMore()
  }
}

const handleLoadMore = async () => {
  if (!hasMore.value || isLoading.value) return

  const prevLength = pins.value.length
  await loadMore()

  // Добавляем новые пины как группу
  const newPins = pins.value.slice(prevLength)
  if (newPins.length > 0) {
    pinGroups.value.push({ pins: newPins, showAllPins: false })
    limitCntLoading.value = newPins.length
    cntLoading.value = 0
  }
}

// Initial load
onMounted(async () => {
  await fetch(0, 10)

  if (pins.value.length === 0) {
    showNoPins.value = true
  } else {
    pinGroups.value = [{ pins: [...pins.value], showAllPins: false }]
    limitCntLoading.value = pins.value.length
  }

  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  cleanup()
})

onActivated(() => {
  window.addEventListener('scroll', handleScroll)
})

onDeactivated(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Reset when board changes
watch(
  () => props.boardId,
  async () => {
    pinGroups.value = []
    showNoPins.value = false
    cntLoading.value = 0
    limitCntLoading.value = null

    await fetch(0, 10)

    if (pins.value.length === 0) {
      showNoPins.value = true
    } else {
      pinGroups.value = [{ pins: [...pins.value], showAllPins: false }]
      limitCntLoading.value = pins.value.length
    }
  },
)

const handlePinLoaded = (groupIndex: number) => {
  cntLoading.value++
  if (cntLoading.value === limitCntLoading.value && pinGroups.value[groupIndex]) {
    pinGroups.value[groupIndex].showAllPins = true
    cntLoading.value = 0
  }
}

const handleRemovePin = async (pinId: string) => {
  try {
    await removePin(pinId)
    // Remove from local groups
    pinGroups.value.forEach((group) => {
      group.pins = group.pins.filter((p) => p.id !== pinId)
    })
    emit('pinRemove', pinId)
  } catch (error) {
    console.error('[BoardPins] Remove failed:', error)
  }
}
</script>

<template>
  <!-- Masonry layout (точно как в старом PinsByBoard.vue) -->
  <div class="mt-10" v-masonry transition-duration="0.4s" item-selector=".item" stagger="0.03s">
    <div v-for="(pinGroup, groupIndex) in pinGroups" :key="groupIndex">
      <div v-for="pin in pinGroup.pins" :key="pin.id" v-masonry-tile class="item w-1/5 p-2">
        <!-- Pin Card -->
        <div
          class="relative block transition-transform transform hover:scale-105 cursor-pointer group"
          @click="emit('pinClick', pin)"
        >
          <!-- Remove button (если canEdit) -->
          <button
            v-if="canEdit"
            @click.stop="handleRemovePin(pin.id)"
            class="absolute z-10 top-2 right-2 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-full transition opacity-0 group-hover:opacity-100"
          >
            Remove
          </button>

          <!-- Placeholder (показывается пока не загружен, с rgb цветом) -->
          <div
            v-show="!pinGroup.showAllPins"
            class="w-full rounded-3xl"
            :style="{ backgroundColor: pin.rgb || '#e5e7eb', height: (pin.height || 200) + 'px' }"
          />

          <!-- Image -->
          <img
            v-if="pin.isImage !== false"
            v-show="pinGroup.showAllPins"
            :src="pin.imageBlobUrl"
            @load="handlePinLoaded(groupIndex)"
            :alt="pin.title || 'Pin'"
            class="w-full h-auto rounded-3xl"
          />

          <!-- Video -->
          <video
            v-else
            v-show="pinGroup.showAllPins"
            :src="pin.videoBlobUrl || pin.imageBlobUrl"
            @loadeddata="handlePinLoaded(groupIndex)"
            class="w-full h-auto rounded-3xl"
            autoplay
            loop
            muted
          />
        </div>

        <!-- Title -->
        <p v-if="pin.title" class="mt-2 text-sm">{{ pin.title }}</p>
      </div>
    </div>
  </div>

  <!-- No pins message (из старого проекта) -->
  <div v-show="showNoPins" class="mt-10">
    <section class="text-center flex flex-col justify-center items-center relative">
      <h1 class="text-2xl font-bold mb-4">no pins on board</h1>
      <img
        class="h-72 rounded-xl"
        src="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
        alt="not found image"
      />
    </section>
  </div>
</template>
