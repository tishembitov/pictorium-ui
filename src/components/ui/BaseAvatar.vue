<script setup lang="ts">
import { ref, computed } from 'vue'

export interface BaseAvatarProps {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  status?: 'online' | 'offline' | 'away' | 'busy' | null
  shape?: 'circle' | 'square'
}

const props = withDefaults(defineProps<BaseAvatarProps>(), {
  src: '',
  alt: '',
  size: 'md',
  fallback: '',
  status: null,
  shape: 'circle',
})

const imageError = ref(false)

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
}

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
}

const fallbackText = computed(() => {
  if (props.fallback) return props.fallback
  if (props.alt) return props.alt.charAt(0).toUpperCase()
  return '?'
})

const handleImageError = () => {
  imageError.value = true
}
</script>

<template>
  <div class="relative inline-block">
    <div
      :class="[
        'flex items-center justify-center overflow-hidden bg-gray-300 text-gray-600 font-semibold',
        sizeClasses[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
      ]"
    >
      <img
        v-if="src && !imageError"
        :src="src"
        :alt="alt"
        :class="['w-full h-full object-cover', shape === 'circle' ? 'rounded-full' : 'rounded-lg']"
        @error="handleImageError"
      />
      <span v-else>{{ fallbackText }}</span>
    </div>

    <!-- Status indicator -->
    <span
      v-if="status"
      :class="[
        'absolute bottom-0 right-0 rounded-full border-2 border-white',
        statusColors[status],
        statusSizeClasses[size],
      ]"
    ></span>
  </div>
</template>
