<!-- src/components/features/pins/detail/RelatedPins.vue -->
<script setup lang="ts">
/**
 * RelatedPins - Похожие пины с infinite scroll
 * Использует: useRelatedPins, useDebouncedFn, useEventListener
 */

import { ref, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { useRelatedPins } from '@/composables/api/useRelatedPins'
import { useDebouncedFn } from '@/composables/utils/useDebounce'
import PinCard from '../PinCard.vue'
import type { PinGroup } from '../PinMasonry.vue'

export interface RelatedPinsProps {
  pinId: string
  initialLimit?: number
  loadMoreLimit?: number
}

const props = withDefaults(defineProps<RelatedPinsProps>(), {
  initialLimit: 10,
  loadMoreLimit: 5,
})

const emit = defineEmits<(e: 'hasRelated') => void>()

// Composable
const { pins, isLoading, hasMore, fetch, loadMore } = useRelatedPins(() => props.pinId, {
  pageSize: props.initialLimit,
})

// Local state for masonry groups
const pinGroups = ref<PinGroup[]>([])
const loadedCounts = ref(new Map<string, number>())
const hasRelatedPins = ref(false)

// Debounced scroll handler
const { execute: debouncedScroll } = useDebouncedFn(() => {
  const scrollableHeight = document.documentElement.scrollHeight
  const currentScrollPosition = window.innerHeight + window.scrollY

  if (currentScrollPosition + 200 >= scrollableHeight) {
    handleLoadMore()
  }
}, 100)

function handleScroll() {
  debouncedScroll()
}

// Load more pins
async function handleLoadMore() {
  if (isLoading.value || !hasMore.value) return

  try {
    const newPins = await loadMore()

    if (newPins.length > 0) {
      const groupId = `group-${Date.now()}`
      pinGroups.value.push({
        id: groupId,
        pins: newPins,
        showAllPins: false,
        loadedCount: 0,
      })
    }
  } catch (error) {
    console.error('[RelatedPins] Failed to load more:', error)
  }
}

// Handle pin loaded
function handlePinLoaded(groupId: string, totalPins: number) {
  const current = loadedCounts.value.get(groupId) || 0
  const newCount = current + 1
  loadedCounts.value.set(groupId, newCount)

  if (newCount >= totalPins) {
    const group = pinGroups.value.find((g) => g.id === groupId)
    if (group) {
      group.showAllPins = true
    }
  }
}

// Initial load
async function initialLoad() {
  try {
    const initialPins = await fetch(0, true)

    if (initialPins.length > 0) {
      hasRelatedPins.value = true
      emit('hasRelated')

      pinGroups.value = [
        {
          id: 'initial',
          pins: initialPins,
          showAllPins: false,
          loadedCount: 0,
        },
      ]
    }
  } catch (error) {
    console.error('[RelatedPins] Failed to fetch:', error)
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  initialLoad()
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

// Watch for pinId changes
watch(
  () => props.pinId,
  () => {
    pinGroups.value = []
    loadedCounts.value.clear()
    hasRelatedPins.value = false
    initialLoad()
  },
)
</script>

<template>
  <div
    class="mt-10 ml-20"
    v-masonry
    transition-duration="0.4s"
    item-selector=".item"
    stagger="0.03s"
  >
    <template v-for="pinGroup in pinGroups" :key="pinGroup.id">
      <PinCard
        v-for="pin in pinGroup.pins"
        :key="pin.id"
        v-masonry-tile
        class="item"
        :pin="pin"
        :show-all-pins="pinGroup.showAllPins"
        @load="handlePinLoaded(pinGroup.id, pinGroup.pins.length)"
      />
    </template>
  </div>
</template>
