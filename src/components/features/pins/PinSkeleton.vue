<!-- src/components/features/pin/PinSkeleton.vue -->
<script setup lang="ts">
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

export interface PinSkeletonProps {
  height?: number
  rgb?: string
  showUser?: boolean
  showTitle?: boolean
  width?: string
}

const props = withDefaults(defineProps<PinSkeletonProps>(), {
  height: 200,
  rgb: '#e5e7eb',
  showUser: true,
  showTitle: true,
  width: 'w-1/5',
})
</script>

<template>
  <div :class="[width, 'p-2']">
    <div class="block">
      <!-- Image skeleton -->
      <div
        class="w-full rounded-3xl overflow-hidden"
        :style="{ backgroundColor: rgb, height: `${height}px` }"
      >
        <BaseSkeleton variant="rectangular" width="100%" :height="height" animation="pulse" />
      </div>

      <!-- Title skeleton -->
      <div v-if="showTitle" class="mt-2">
        <BaseSkeleton variant="text" width="75%" height="1rem" animation="pulse" />
      </div>

      <!-- User skeleton -->
      <div v-if="showUser" class="flex items-center mt-2 gap-2">
        <BaseSkeleton variant="circular" width="32px" height="32px" animation="pulse" />
        <BaseSkeleton variant="text" width="80px" height="0.875rem" animation="pulse" />
      </div>
    </div>
  </div>
</template>
