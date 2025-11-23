<script setup lang="ts">
import { computed } from 'vue'

export interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
  rounded: 'full',
  type: 'button',
})

const emit = defineEmits<(e: 'click', event: MouseEvent) => void>()

const classes = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-semibold',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ]

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-red-600',
      'text-white',
      'hover:bg-red-700',
      'focus:ring-red-500',
      'active:bg-red-800',
    ],
    secondary: ['bg-gray-800', 'text-white', 'hover:bg-black', 'focus:ring-gray-500'],
    outline: [
      'bg-transparent',
      'border-2',
      'border-black',
      'text-black',
      'hover:bg-black',
      'hover:text-white',
      'focus:ring-black',
    ],
    ghost: ['bg-transparent', 'text-gray-700', 'hover:bg-gray-100', 'focus:ring-gray-400'],
    danger: ['bg-red-600', 'text-white', 'hover:bg-red-700', 'focus:ring-red-500'],
  }

  // Size classes
  const sizeClasses = {
    sm: ['text-sm', 'px-3', 'py-1.5'],
    md: ['text-base', 'px-6', 'py-3'],
    lg: ['text-lg', 'px-8', 'py-4'],
  }

  // Rounded classes
  const roundedClasses = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  }

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...sizeClasses[props.size],
    roundedClasses[props.rounded],
    props.fullWidth && 'w-full',
  ]
})

const handleClick = (event: MouseEvent) => {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading" @click="handleClick">
    <!-- Loading spinner -->
    <span
      v-if="loading"
      class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
    ></span>

    <!-- Icon slot -->
    <slot name="icon" />

    <!-- Default slot (text) -->
    <slot />
  </button>
</template>
