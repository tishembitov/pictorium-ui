<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useWindowSize } from '@/composables/utils'
import { calculateColumnsCount } from '@/utils/masonry'

export interface PinGridProps {
  columnWidth?: number
  gap?: number
  minColumns?: number
  maxColumns?: number
}

const props = withDefaults(defineProps<PinGridProps>(), {
  columnWidth: 272,
  gap: 16,
  minColumns: 1,
  maxColumns: Infinity,
})

const containerRef = ref<HTMLElement | null>(null)
const { width: windowWidth } = useWindowSize()

// Calculate columns based on window width
const columnsCount = computed(() => {
  const cols = calculateColumnsCount(windowWidth.value, props.columnWidth, props.gap)
  return Math.max(props.minColumns, Math.min(props.maxColumns, cols))
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columnsCount.value}, 1fr)`,
  gap: `${props.gap}px`,
}))
</script>

<template>
  <div ref="containerRef" :style="gridStyle" class="w-full">
    <slot />
  </div>
</template>
