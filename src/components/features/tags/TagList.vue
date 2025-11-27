<!-- src/components/features/tag/TagList.vue -->
<script setup lang="ts">
/**
 * TagList - Список тегов с поддержкой выбора и удаления
 */

import { computed } from 'vue'
import TagBadge from './TagBadge.vue'
import { randomTagColor } from '@/utils/colors'
import type { Tag } from '@/types'

export interface TagItem {
  id: string | number
  name: string
  color?: string
}

export interface TagListProps {
  /** Массив тегов */
  tags: TagItem[] | Tag[]
  /** Выбранные теги (id или name) */
  selectedTags?: (string | number)[]
  /** Можно ли выбирать теги */
  selectable?: boolean
  /** Можно ли удалять теги */
  removable?: boolean
  /** Максимальное количество видимых тегов */
  maxVisible?: number
  /** Размер тегов */
  size?: 'sm' | 'md' | 'lg'
  /** Переносить ли теги */
  wrap?: boolean
  /** Показывать # */
  showHash?: boolean
  /** Выравнивание */
  align?: 'start' | 'center' | 'end'
}

const props = withDefaults(defineProps<TagListProps>(), {
  selectedTags: () => [],
  selectable: false,
  removable: false,
  maxVisible: 0,
  size: 'md',
  wrap: true,
  showHash: false,
  align: 'start',
})

const emit = defineEmits<{
  (e: 'select', tag: TagItem): void
  (e: 'remove', tag: TagItem): void
  (e: 'showAll'): void
}>()

// Теги с цветами
const tagsWithColors = computed(() => {
  return props.tags.map((tag) => ({
    ...tag,
    color: (tag as TagItem).color || randomTagColor(),
  }))
})

// Видимые теги
const visibleTags = computed(() => {
  if (props.maxVisible > 0) {
    return tagsWithColors.value.slice(0, props.maxVisible)
  }
  return tagsWithColors.value
})

// Количество скрытых тегов
const hiddenCount = computed(() => {
  if (props.maxVisible > 0 && props.tags.length > props.maxVisible) {
    return props.tags.length - props.maxVisible
  }
  return 0
})

// Проверка выбран ли тег
const isSelected = (tag: TagItem) => {
  return props.selectedTags.includes(tag.id) || props.selectedTags.includes(tag.name)
}

// Классы выравнивания
const alignClasses = computed(() => {
  const classes = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  }
  return classes[props.align]
})

const handleSelect = (tag: TagItem) => {
  emit('select', tag)
}

const handleRemove = (tag: TagItem) => {
  emit('remove', tag)
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2',
      wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto scrollbar-hide',
      alignClasses,
    ]"
    v-auto-animate
  >
    <TagBadge
      v-for="tag in visibleTags"
      :key="tag.id"
      :name="tag.name"
      :id="tag.id"
      :color="tag.color"
      :selected="isSelected(tag)"
      :removable="removable"
      :clickable="selectable"
      :size="size"
      :show-hash="showHash"
      @click="handleSelect(tag)"
      @remove="handleRemove(tag)"
    />

    <!-- Кнопка "показать больше" -->
    <button
      v-if="hiddenCount > 0"
      @click="emit('showAll')"
      type="button"
      :class="[
        'inline-flex items-center rounded-full font-medium bg-gray-200 text-gray-700',
        'hover:bg-gray-300 transition-colors cursor-pointer',
        size === 'sm'
          ? 'text-xs px-2 py-1'
          : size === 'md'
            ? 'text-sm px-3 py-2'
            : 'text-base px-4 py-2',
      ]"
    >
      +{{ hiddenCount }}
    </button>

    <!-- Слот для дополнительных элементов -->
    <slot name="append" />
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
