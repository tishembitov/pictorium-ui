<!-- src/components/features/boards/SelectedBoardBadge.vue -->
<script setup lang="ts">
/**
 * SelectedBoardBadge - Badge выбранной доски
 *
 * Показывает куда будет сохранен пин (из старого Pin.vue)
 */

import { computed } from 'vue'
import { useSelectedBoard } from '@/composables/api/useSelectedBoard'

export interface SelectedBoardBadgeProps {
  variant?: 'text' | 'badge' | 'button'
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
}

const props = withDefaults(defineProps<SelectedBoardBadgeProps>(), {
  variant: 'button',
  size: 'md',
  clickable: true,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const { boardTitle, hasSelected, isLoading } = useSelectedBoard()

const displayText = computed(() => boardTitle.value)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-6 py-3',
    lg: 'text-md px-8 py-4',
  }
  return sizes[props.size]
})

const handleClick = () => {
  if (props.clickable && !isLoading.value) {
    emit('click')
  }
}
</script>

<template>
  <!-- Text variant -->
  <span
    v-if="variant === 'text'"
    :class="[
      'font-medium',
      hasSelected ? 'text-red-600' : 'text-gray-700',
      clickable && !isLoading && 'cursor-pointer hover:underline',
    ]"
    @click="handleClick"
  >
    {{ displayText }}
  </span>

  <!-- Badge variant -->
  <span
    v-else-if="variant === 'badge'"
    :class="[
      'inline-flex items-center gap-2 rounded-full font-medium',
      sizeClasses,
      hasSelected ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700',
      clickable && !isLoading && 'cursor-pointer hover:opacity-80 transition',
    ]"
    @click="handleClick"
  >
    <i :class="['pi', hasSelected ? 'pi-folder' : 'pi-user']"></i>
    {{ displayText }}
  </span>

  <!-- Button variant (стиль из старого Pin.vue) -->
  <button
    v-else
    @click="handleClick"
    :class="[
      'bg-gray-800 hover:bg-black text-white rounded-3xl transition cursor-pointer',
      sizeClasses,
      isLoading && 'opacity-50 cursor-wait',
    ]"
    :disabled="isLoading"
  >
    {{ isLoading ? 'Loading...' : displayText }}
  </button>
</template>
