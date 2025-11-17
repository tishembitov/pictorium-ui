<script setup lang="ts">
import { useRouter } from 'vue-router'

export interface BackButtonProps {
  to?: string
  label?: string
  variant?: 'icon' | 'text' | 'both'
  position?: 'fixed' | 'relative' | 'absolute'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<BackButtonProps>(), {
  label: 'Back',
  variant: 'icon',
  position: 'absolute',
  size: 'md',
})

const router = useRouter()

const handleClick = () => {
  if (props.to) {
    router.push(props.to)
  } else {
    router.back()
  }
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-12 h-12 text-2xl',
}

const positionClasses = {
  fixed: 'fixed top-4 left-24',
  relative: 'relative',
  absolute: 'absolute top-4 left-24',
}
</script>

<template>
  <button
    @click="handleClick"
    :class="[
      'flex items-center gap-2 text-gray-500 transition-transform duration-200',
      'hover:text-gray-900 hover:-translate-x-2',
      positionClasses[position],
      variant === 'icon' && 'p-2',
      variant === 'text' && 'px-0 py-2',
      variant === 'both' && 'px-2 py-2',
    ]"
  >
    <svg
      v-if="variant === 'icon' || variant === 'both'"
      :class="sizeClasses[size]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>

    <span v-if="variant === 'text' || variant === 'both'" class="font-medium">
      {{ label }}
    </span>
  </button>
</template>
