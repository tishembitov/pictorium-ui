<script setup lang="ts">
export interface BaseSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  count?: number
  animation?: 'pulse' | 'wave' | 'none'
}

const props = withDefaults(defineProps<BaseSkeletonProps>(), {
  variant: 'text',
  width: '100%',
  height: '1rem',
  count: 1,
  animation: 'pulse',
})

const variantClasses = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg',
}

const animationClasses = {
  pulse: 'animate-pulse',
  wave: 'skeleton-wave',
  none: '',
}

const getSize = (value: string | number) => {
  return typeof value === 'number' ? `${value}px` : value
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="i in count"
      :key="i"
      :class="['bg-gray-300', variantClasses[variant], animationClasses[animation]]"
      :style="{
        width: getSize(width),
        height: getSize(height),
      }"
    ></div>
  </div>
</template>

<style scoped>
@keyframes wave {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-wave {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: wave 1.5s ease-in-out infinite;
}
</style>
