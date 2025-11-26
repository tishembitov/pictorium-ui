<!-- src/components/features/pin/PinGrid.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import PinCard from './PinCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { PinWithBlob } from '@/types'

export interface PinGridProps {
  pins: PinWithBlob[]
  columns?: 2 | 3 | 4 | 5 | 6
  showUser?: boolean
  variant?: 'default' | 'created' | 'saved' | 'deletable' | 'board'
  emptyTitle?: string
  emptyMessage?: string
  emptyImage?: string
}

const props = withDefaults(defineProps<PinGridProps>(), {
  columns: 5,
  showUser: true,
  variant: 'default',
  emptyTitle: 'No pins',
  emptyMessage: '',
  emptyImage: 'https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg',
})

const emit = defineEmits<{
  (e: 'delete', pinId: string): void
  (e: 'openBoardSelector', pinId: string): void
  (e: 'pinLoad', pinId: string): void
}>()

const gridClass = computed(
  () =>
    ({
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    })[props.columns],
)

const isEmpty = computed(() => props.pins.length === 0)
</script>

<template>
  <!-- Empty state -->
  <EmptyState
    v-if="isEmpty"
    :title="emptyTitle"
    :message="emptyMessage"
    :image="emptyImage"
    class="mt-10"
  />

  <!-- Grid -->
  <div v-else :class="['grid gap-4', gridClass]">
    <PinCard
      v-for="pin in pins"
      :key="pin.id"
      :pin="pin"
      :show-user="showUser"
      :variant="variant"
      class="!w-full !p-0"
      @load="emit('pinLoad', pin.id)"
      @delete="emit('delete', pin.id)"
      @open-board-selector="emit('openBoardSelector', pin.id)"
    />
  </div>
</template>
