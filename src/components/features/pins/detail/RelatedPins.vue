<script setup lang="ts">
import { computed } from 'vue'
import PinCard from '../PinCard.vue'
import PinGrid from '../PinGrid.vue'
import type { Pin } from '@/types'

export interface RelatedPinsProps {
  pins: Pin[]
  currentPinId: string
  title?: string
  columnWidth?: number
  gap?: number
}

const props = withDefaults(defineProps<RelatedPinsProps>(), {
  title: 'More like this',
  columnWidth: 236,
  gap: 16,
})

const emit = defineEmits<(e: 'pinClick', pinId: string) => void>()

// Filter out current pin from related
const filteredPins = computed(() => {
  return props.pins.filter((pin) => pin.id !== props.currentPinId)
})
</script>

<template>
  <div v-if="filteredPins.length > 0" class="w-full">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 text-center">
        {{ title }}
      </h2>
      <p class="text-gray-600 text-center mt-2">{{ filteredPins.length }} related pins</p>
    </div>

    <!-- Grid -->
    <PinGrid :column-width="columnWidth" :gap="gap">
      <PinCard
        v-for="pin in filteredPins"
        :key="pin.id"
        :pin="pin"
        :show-actions="true"
        :show-user="true"
        :show-info="true"
        @click="emit('pinClick', pin.id)"
      />
    </PinGrid>
  </div>
</template>
