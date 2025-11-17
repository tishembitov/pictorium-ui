<script setup lang="ts">
import { computed } from 'vue'

export interface BaseBadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  dot?: boolean
  count?: number
  maxCount?: number
}

const props = withDefaults(defineProps<BaseBadgeProps>(), {
  variant: 'default',
  size: 'md',
  rounded: true,
  dot: false,
  maxCount: 99,
})

const variantClasses = {
  default: 'bg-gray-200 text-gray-800',
  primary: 'bg-red-500 text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  danger: 'bg-red-600 text-white',
  info: 'bg-blue-500 text-white',
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
}

const displayCount = computed(() => {
  if (props.count === undefined) return ''
  return props.count > props.maxCount ? `${props.maxCount}+` : props.count
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center justify-center font-medium',
      variantClasses[variant],
      sizeClasses[size],
      rounded ? 'rounded-full' : 'rounded',
      dot && 'w-2 h-2 p-0',
    ]"
  >
    <template v-if="!dot">
      <span v-if="count !== undefined">{{ displayCount }}</span>
      <slot v-else />
    </template>
  </span>
</template>
