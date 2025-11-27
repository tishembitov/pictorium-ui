<!-- src/components/features/tag/TagCloud.vue -->
<script setup lang="ts">
/**
 * TagCloud - Облако тегов с разными размерами на основе популярности
 */

import { computed } from 'vue'
import TagBadge from '@/components/features/tags/TagBadge.vue'
import { randomTagColor } from '@/utils/colors'

export interface TagCloudItem {
  id: string | number
  name: string
  count?: number
  color?: string
}

export interface TagCloudProps {
  /** Массив тегов */
  tags: TagCloudItem[]
  /** Выбранные теги */
  selectedTags?: (string | number)[]
  /** Минимальный размер */
  minSize?: 'sm' | 'md'
  /** Максимальный размер */
  maxSize?: 'md' | 'lg'
  /** Максимальное количество тегов */
  maxTags?: number
  /** Показывать счетчик */
  showCount?: boolean
}

const props = withDefaults(defineProps<TagCloudProps>(), {
  selectedTags: () => [],
  minSize: 'sm',
  maxSize: 'lg',
  maxTags: 50,
  showCount: false,
})

const emit = defineEmits<{
  (e: 'select', tag: TagCloudItem): void
}>()

// Сортированные и ограниченные теги
const sortedTags = computed(() => {
  return [...props.tags].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, props.maxTags)
})

// Минимальный и максимальный count для расчета размера
const countRange = computed(() => {
  const counts = sortedTags.value.map((t) => t.count || 0)
  return {
    min: Math.min(...counts),
    max: Math.max(...counts),
  }
})

// Определение размера тега на основе count
const getTagSize = (count: number = 0): 'sm' | 'md' | 'lg' => {
  const { min, max } = countRange.value
  if (max === min) return 'md'

  const ratio = (count - min) / (max - min)

  if (ratio > 0.66) return 'lg'
  if (ratio > 0.33) return 'md'
  return 'sm'
}

// Теги с цветами и размерами
const tagsWithMeta = computed(() => {
  // Перемешиваем для естественного вида облака
  const shuffled = [...sortedTags.value].sort(() => Math.random() - 0.5)

  return shuffled.map((tag) => ({
    ...tag,
    color: tag.color || randomTagColor(),
    size: getTagSize(tag.count),
  }))
})

const isSelected = (tag: TagCloudItem) => {
  return props.selectedTags.includes(tag.id) || props.selectedTags.includes(tag.name)
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center justify-center p-4" v-auto-animate>
    <div v-for="tag in tagsWithMeta" :key="tag.id" class="inline-flex items-center gap-1">
      <TagBadge
        :name="tag.name"
        :id="tag.id"
        :color="tag.color"
        :size="tag.size"
        :selected="isSelected(tag)"
        clickable
        @click="emit('select', tag)"
      />

      <!-- Счетчик (опционально) -->
      <span v-if="showCount && tag.count" class="text-xs text-gray-400"> ({{ tag.count }}) </span>
    </div>
  </div>
</template>
