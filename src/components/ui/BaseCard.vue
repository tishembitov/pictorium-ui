<script setup lang="ts">
export interface BaseCardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  border?: boolean
  hoverable?: boolean
}

const props = withDefaults(defineProps<BaseCardProps>(), {
  padding: 'md',
  shadow: 'md',
  rounded: '2xl',
  border: false,
  hoverable: false,
})

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
}

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
}
</script>

<template>
  <div
    :class="[
      'bg-white',
      paddingClasses[padding],
      shadowClasses[shadow],
      roundedClasses[rounded],
      border && 'border border-gray-200',
      hoverable && 'transition-transform duration-200 hover:scale-105 cursor-pointer',
    ]"
  >
    <slot />
  </div>
</template>
