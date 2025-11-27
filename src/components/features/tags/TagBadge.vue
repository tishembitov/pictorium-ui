<!-- src/components/features/tag/TagBadge.vue -->
<script setup lang="ts">
/**
 * TagBadge - Badge тега с поддержкой выбора, удаления и цветов
 */

import { computed } from 'vue'
import { randomTagColor } from '@/utils/colors'

export interface TagBadgeProps {
  /** Имя тега */
  name: string
  /** ID тега (опционально) */
  id?: string | number
  /** Цвет фона (Tailwind класс) */
  color?: string
  /** Выбран ли тег */
  selected?: boolean
  /** Можно ли удалить */
  removable?: boolean
  /** Можно ли кликать */
  clickable?: boolean
  /** Размер */
  size?: 'sm' | 'md' | 'lg'
  /** Показывать # перед именем */
  showHash?: boolean
  /** Вариант отображения */
  variant?: 'default' | 'outline' | 'ghost'
}

const props = withDefaults(defineProps<TagBadgeProps>(), {
  color: '',
  selected: false,
  removable: false,
  clickable: true,
  size: 'md',
  showHash: false,
  variant: 'default',
})

const emit = defineEmits<{
  click: [name: string]
  remove: [name: string]
}>()

// Генерируем цвет если не передан
const tagColor = computed(() => props.color || randomTagColor())

// Классы размера
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2.5',
  }
  return sizes[props.size]
})

// Классы варианта
const variantClasses = computed(() => {
  if (props.selected) {
    return 'bg-black text-white shadow-lg scale-110'
  }

  const variants = {
    default: tagColor.value,
    outline: `border-2 border-current bg-transparent ${tagColor.value.replace('bg-', 'text-').replace('-200', '-600')}`,
    ghost: `bg-transparent hover:${tagColor.value}`,
  }
  return variants[props.variant]
})

// Общие классы
const baseClasses = computed(() => [
  'inline-flex items-center gap-1.5 rounded-full font-medium',
  'transition-all duration-200 transform',
  sizeClasses.value,
  variantClasses.value,
  props.clickable && !props.selected && 'cursor-pointer hover:scale-110',
  props.selected && 'cursor-pointer',
  !props.clickable && 'cursor-default',
])

// Обработчики как функции (не стрелочные на верхнем уровне)
function onBadgeClick(): void {
  if (props.clickable) {
    emit('click', props.name)
  }
}

function onRemoveClick(event: Event): void {
  event.stopPropagation()
  emit('remove', props.name)
}
</script>

<template>
  <div @click="onBadgeClick" :class="baseClasses">
    <!-- Иконка хэша -->
    <span v-if="showHash" class="opacity-60">#</span>

    <!-- Имя тега -->
    <span class="truncate max-w-[150px]">{{ name }}</span>

    <!-- Кнопка удаления -->
    <button
      v-if="removable"
      @click="onRemoveClick"
      type="button"
      class="ml-0.5 p-0.5 rounded-full hover:bg-black/20 transition-colors"
      :class="selected ? 'hover:bg-white/20' : ''"
      aria-label="Remove tag"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>
