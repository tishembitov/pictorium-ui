<!-- src/components/features/boards/BoardGrid.vue -->
<script setup lang="ts">
/**
 * BoardGrid - Grid layout для досок
 *
 * ✅ Визуальный стиль из старого Boards.vue:
 * - grid-cols-5 gap-2 mx-2
 */

import { computed } from 'vue'

export interface BoardGridProps {
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 1 | 2 | 4 | 6
}

const props = withDefaults(defineProps<BoardGridProps>(), {
  columns: 5,
  gap: 2,
})

const gridClasses = computed(() => {
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }

  const gapMap: Record<number, string> = {
    1: 'gap-1',
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
  }

  return [colsMap[props.columns], gapMap[props.gap]]
})
</script>

<template>
  <div :class="['grid mx-2', ...gridClasses]">
    <slot />
  </div>
</template>
