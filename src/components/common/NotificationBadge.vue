<script setup lang="ts">
import { computed } from 'vue'
import { formatCompactNumber } from '@/utils/formatters'
import { clamp } from '@/utils/helpers'

export interface NotificationBadgeProps {
  count?: number
  maxCount?: number
  dot?: boolean
  pulse?: boolean
  variant?: 'primary' | 'danger' | 'warning' | 'success'
  size?: 'sm' | 'md' | 'lg'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showZero?: boolean
  useCompactFormat?: boolean
}

const props = withDefaults(defineProps<NotificationBadgeProps>(), {
  count: 0,
  maxCount: 99,
  dot: false,
  pulse: false,
  variant: 'primary',
  size: 'sm',
  position: 'top-right',
  showZero: false,
  useCompactFormat: false,
})

const shouldShow = computed(() => {
  if (props.dot) return true
  return props.count > 0 || props.showZero
})

const displayCount = computed(() => {
  const count = clamp(props.count, 0, Infinity)

  if (props.useCompactFormat) {
    return formatCompactNumber(count)
  }

  if (count > props.maxCount) {
    return `${props.maxCount}+`
  }

  return count.toString()
})

const variantClasses = computed(() => {
  const classes = {
    primary: 'bg-red-500 text-white',
    danger: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    success: 'bg-green-500 text-white',
  }
  return classes[props.variant]
})

const sizeClasses = computed(() => {
  if (props.dot) {
    return {
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
    }[props.size]
  }

  return {
    sm: 'w-5 h-5 text-xs min-w-[1.25rem]',
    md: 'w-6 h-6 text-xs min-w-[1.5rem]',
    lg: 'w-7 h-7 text-sm min-w-[1.75rem]',
  }[props.size]
})

const positionClasses = computed(() => {
  const positions = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  }
  return positions[props.position]
})

const animationClasses = computed(() => {
  return props.pulse ? 'animate-pulse' : ''
})
</script>

<template>
  <span
    v-if="shouldShow"
    :class="[
      'absolute rounded-full flex items-center justify-center font-bold',
      variantClasses,
      sizeClasses,
      positionClasses,
      animationClasses,
      !dot && 'border-2 border-white shadow-sm',
    ]"
    :aria-label="dot ? 'New notification' : `${count} notifications`"
    role="status"
  >
    <span v-if="!dot" class="px-1">{{ displayCount }}</span>
  </span>
</template>
