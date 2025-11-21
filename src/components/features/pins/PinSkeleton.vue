<script setup lang="ts">
export interface PinSkeletonProps {
  color?: string
  height?: number
  rounded?: boolean
  animate?: boolean
}

const props = withDefaults(defineProps<PinSkeletonProps>(), {
  color: '#e0e0e0',
  height: 300,
  rounded: true,
  animate: true,
})
</script>

<template>
  <div
    :class="['w-full', rounded && 'rounded-3xl', animate && 'animate-pulse']"
    :style="{
      backgroundColor: color,
      height: height ? `${height}px` : 'auto',
    }"
  >
    <!-- Optional skeleton content -->
    <slot />
  </div>
</template>
