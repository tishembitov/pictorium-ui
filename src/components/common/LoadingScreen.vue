<script setup lang="ts">
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface LoadingScreenProps {
  variant?: 'logo' | 'spinner' | 'dots'
  message?: string
  overlay?: boolean
  blur?: boolean
}

const props = withDefaults(defineProps<LoadingScreenProps>(), {
  variant: 'logo',
  message: '',
  overlay: true,
  blur: true,
})
</script>

<template>
  <div
    :class="[
      'fixed inset-0 z-50 flex flex-col items-center justify-center',
      overlay ? 'bg-white' : 'bg-transparent',
      blur && 'backdrop-blur-sm',
    ]"
  >
    <BaseLoader :variant="variant" size="lg" fullscreen />

    <p v-if="message" class="mt-6 text-lg text-gray-600 font-medium animate-pulse">
      {{ message }}
    </p>

    <slot />
  </div>
</template>
