<script setup lang="ts">
import { ref, computed } from 'vue'
import PinCard from './PinCard.vue'
import PinGrid from './PinGrid.vue'
import PinSkeleton from './PinSkeleton.vue'
import { useInfiniteScroll } from '@/composables/utils'
import type { Pin } from '@/types'

export interface PinMasonryProps {
  pins: Pin[]
  variant?: 'default' | 'created' | 'saved' | 'board'
  loading?: boolean
  hasMore?: boolean
  canDelete?: boolean
  columnWidth?: number
  gap?: number
}

const props = withDefaults(defineProps<PinMasonryProps>(), {
  variant: 'default',
  loading: false,
  hasMore: false,
  canDelete: false,
  columnWidth: 272,
  gap: 16,
})

const emit = defineEmits<{
  (e: 'loadMore'): void
  (e: 'pinLoaded', pinId: string): void
  (e: 'save', pinId: string): void
  (e: 'delete', pinId: string): void
  (e: 'like', pinId: string): void
}>()

const loadMoreRef = ref<HTMLElement | null>(null)

// Intersection observer for infinite scroll
const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
  threshold: 0.1,
})

watch(isIntersecting, (intersecting) => {
  if (intersecting && props.hasMore && !props.loading) {
    emit('loadMore')
  }
})

// Track loaded pins
const loadedPins = ref(new Set<string>())

const handlePinLoaded = (pinId: string) => {
  loadedPins.value.add(pinId)
  emit('pinLoaded', pinId)
}

const isPinLoaded = (pinId: string) => {
  return loadedPins.value.has(pinId)
}
</script>

<template>
  <div class="w-full">
    <!-- Pins Grid -->
    <PinGrid :column-width="columnWidth" :gap="gap" class="px-8">
      <PinCard
        v-for="pin in pins"
        :key="pin.id"
        :pin="pin"
        :variant="variant"
        :can-delete="canDelete"
        :loading="!isPinLoaded(pin.id)"
        @loaded="handlePinLoaded(pin.id)"
        @save="emit('save', $event)"
        @delete="emit('delete', $event)"
        @like="emit('like', $event)"
      />
    </PinGrid>

    <!-- Load More Trigger -->
    <div v-if="hasMore" ref="loadMoreRef" class="flex justify-center py-8">
      <BaseLoader v-if="loading" variant="spinner" size="md" />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-if="!loading && pins.length === 0"
      title="No pins"
      message="No pins to display"
      image="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
      class="mt-10"
    />

    <!-- Loading Skeletons (initial load) -->
    <PinGrid
      v-if="loading && pins.length === 0"
      :column-width="columnWidth"
      :gap="gap"
      class="px-8"
    >
      <PinSkeleton
        v-for="i in 10"
        :key="i"
        :height="Math.random() * 200 + 200"
        :color="`hsl(${Math.random() * 360}, 70%, 80%)`"
      />
    </PinGrid>
  </div>
</template>
