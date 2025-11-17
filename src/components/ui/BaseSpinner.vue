<script setup lang="ts">
export interface BaseSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'red' | 'black' | 'white' | 'gray'
}

const props = withDefaults(defineProps<BaseSpinnerProps>(), {
  size: 'md',
  color: 'red',
})

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

const colorClasses = {
  red: 'border-red-600 border-t-transparent',
  black: 'border-black border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
}
</script>

<template>
  <div
    :class="['inline-block rounded-full animate-spin', sizeClasses[size], colorClasses[color]]"
  ></div>
</template>
