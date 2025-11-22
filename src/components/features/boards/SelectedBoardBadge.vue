<script setup lang="ts">
import { computed } from 'vue'
import { useSelectedBoardStore } from '@/stores/selectedBoard.store'

export interface SelectedBoardBadgeProps {
  variant?: 'text' | 'badge' | 'button'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<SelectedBoardBadgeProps>(), {
  variant: 'button',
  size: 'md',
  showIcon: true,
  clickable: true,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const selectedBoardStore = useSelectedBoardStore()

const displayText = computed(() => {
  return selectedBoardStore.selectedBoard ? selectedBoardStore.selectedBoard.title : 'Profile'
})

const sizeClasses = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-6 py-3',
  lg: 'text-base px-8 py-4',
}

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <!-- Text variant -->
  <span
    v-if="variant === 'text'"
    :class="['font-medium text-gray-700', clickable && 'cursor-pointer hover:underline']"
    @click="handleClick"
  >
    <i v-if="showIcon" class="pi pi-folder mr-2"></i>
    {{ displayText }}
  </span>

  <!-- Badge variant -->
  <span
    v-else-if="variant === 'badge'"
    :class="[
      'inline-flex items-center gap-2 rounded-full bg-gray-200 text-gray-800 font-medium',
      sizeClasses[size],
      clickable && 'cursor-pointer hover:bg-gray-300 transition',
    ]"
    @click="handleClick"
  >
    <i v-if="showIcon" class="pi pi-folder"></i>
    {{ displayText }}
  </span>

  <!-- Button variant (из старого кода) -->
  <button
    v-else
    @click="handleClick"
    :class="[
      'bg-gray-800 hover:bg-black text-white rounded-3xl transition',
      sizeClasses[size],
      !clickable && 'cursor-default',
    ]"
    :disabled="!clickable"
  >
    <i v-if="showIcon" class="pi pi-folder mr-2"></i>
    {{ displayText }}
  </button>
</template>
