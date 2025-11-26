<!-- src/components/features/pin/PinMasonry.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { useEventListener } from '@/composables/utils/useEventListener'
import { useDebouncedFn } from '@/composables/utils/useDebounce'
import PinCard from './PinCard.vue'
import PinSkeleton from './PinSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { PinWithBlob } from '@/types'

export interface PinGroup {
  id: string
  pins: PinWithBlob[]
  showAllPins: boolean
  loadedCount?: number
}

export interface PinMasonryProps {
  pinGroups: PinGroup[]
  showUser?: boolean
  variant?: 'default' | 'created' | 'saved' | 'deletable' | 'board'
  transitionDuration?: string
  stagger?: string
  emptyTitle?: string
  emptyMessage?: string
  scrollThreshold?: number
}

const props = withDefaults(defineProps<PinMasonryProps>(), {
  showUser: true,
  variant: 'default',
  transitionDuration: '0.4s',
  stagger: '0.03s',
  emptyTitle: 'No pins',
  emptyMessage: '',
  scrollThreshold: 200,
})

const emit = defineEmits<{
  (e: 'pinLoaded', groupId: string): void
  (e: 'groupLoaded', groupId: string): void
  (e: 'delete', pinId: string): void
  (e: 'loadMore'): void
  (e: 'openBoardSelector', pinId: string): void
}>()

// Track loading per group
const loadingCounts = reactive(new Map<string, number>())

// Debounced scroll handler
const { execute: debouncedScroll } = useDebouncedFn(() => {
  const scrollableHeight = document.documentElement.scrollHeight
  const currentScrollPosition = window.innerHeight + window.scrollY

  if (currentScrollPosition + props.scrollThreshold >= scrollableHeight) {
    emit('loadMore')
  }
}, 100)

// Scroll event listener
function handleScroll() {
  debouncedScroll()
}

// Pin load handler
function handlePinLoad(groupId: string, totalPins: number) {
  const current = loadingCounts.get(groupId) || 0
  const newCount = current + 1
  loadingCounts.set(groupId, newCount)

  emit('pinLoaded', groupId)

  if (newCount >= totalPins) {
    emit('groupLoaded', groupId)
  }
}

function handleDelete(pinId: string) {
  emit('delete', pinId)
}

function handleOpenBoardSelector(pinId: string) {
  emit('openBoardSelector', pinId)
}

// Check if all groups are empty
const isEmpty = () => {
  return props.pinGroups.length === 0 || props.pinGroups.every((g) => g.pins.length === 0)
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

onActivated(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onDeactivated(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <!-- Empty state -->
  <EmptyState
    v-if="isEmpty()"
    :title="emptyTitle"
    :message="emptyMessage"
    image="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
    class="mt-10"
  />

  <!-- Masonry grid -->
  <div
    v-else
    class="ml-20 mt-10"
    v-masonry
    :transition-duration="transitionDuration"
    item-selector=".masonry-item"
    :stagger="stagger"
  >
    <template v-for="pinGroup in pinGroups" :key="pinGroup.id">
      <!-- Actual pins (shown when loaded) -->
      <PinCard
        v-for="pin in pinGroup.pins"
        :key="pin.id"
        v-masonry-tile
        class="masonry-item"
        :pin="pin"
        :show-user="showUser"
        :show-all-pins="pinGroup.showAllPins"
        :variant="variant"
        @load="handlePinLoad(pinGroup.id, pinGroup.pins.length)"
        @delete="handleDelete(pin.id)"
        @open-board-selector="handleOpenBoardSelector(pin.id)"
      />

      <!-- Skeletons (shown while loading) -->
      <template v-if="!pinGroup.showAllPins">
        <PinSkeleton
          v-for="pin in pinGroup.pins"
          :key="`skeleton-${pin.id}`"
          v-masonry-tile
          class="masonry-item"
          :height="pin.height || 200"
          :rgb="pin.rgb || undefined"
        />
      </template>
    </template>
  </div>
</template>
