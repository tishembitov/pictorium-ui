<script setup lang="ts">
import { computed } from 'vue'

export interface BoardGridProps {
  columns?: 1 | 2 | 3 | 4 | 5
  gap?: number
}

const props = withDefaults(defineProps<BoardGridProps>(), {
  columns: 5,
  gap: 2,
})

const gridClasses = computed(() => ({
  'grid-cols-1': props.columns === 1,
  'grid-cols-2': props.columns === 2,
  'grid-cols-3': props.columns === 3,
  'grid-cols-4': props.columns === 4,
  'grid-cols-5': props.columns === 5,
  'gap-1': props.gap === 1,
  'gap-2': props.gap === 2,
  'gap-4': props.gap === 4,
  'gap-6': props.gap === 6,
}))
</script>

<template>
  <div :class="['grid', gridClasses, 'mx-2']">
    <slot />
  </div>
</template>
