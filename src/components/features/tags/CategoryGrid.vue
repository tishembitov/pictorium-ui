<!-- src/components/features/tag/CategoryGrid.vue -->
<script setup lang="ts">
/**
 * CategoryGrid - Grid категорий с загрузкой превью
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import CategoryCard from './CategoryCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import { useCategories } from '@/composables/api/useTagSearch'
import { storageApi } from '@/api'
import { randomTagColor } from '@/utils/colors'
import { isVideoUrl } from '@/utils/media'
import type { Category } from '@/types'

export interface CategoryWithBlob extends Category {
  previewBlobUrl?: string
  isVideo?: boolean
  color?: string
}

export interface CategoryGridProps {
  /** Количество категорий */
  limit?: number
  /** Размер карточек */
  cardSize?: 'sm' | 'md' | 'lg'
  /** Колонки */
  columns?: number
  /** Заголовок */
  title?: string
  /** Показывать заголовок */
  showTitle?: boolean
}

const props = withDefaults(defineProps<CategoryGridProps>(), {
  limit: 12,
  cardSize: 'md',
  columns: 4,
  title: 'Explore Categories',
  showTitle: true,
})

const emit = defineEmits<{
  (e: 'select', tagName: string): void
}>()

// Composable
const { categories, isLoading, error, fetch } = useCategories()

// Категории с blob URLs
const categoriesWithBlobs = ref<CategoryWithBlob[]>([])
const isLoadingBlobs = ref(false)

// Cleanup blob URLs
const cleanupBlobs = () => {
  categoriesWithBlobs.value.forEach((cat) => {
    if (cat.previewBlobUrl) {
      URL.revokeObjectURL(cat.previewBlobUrl)
    }
  })
}

// Загрузка blob для категории
const loadCategoryBlob = async (category: Category): Promise<CategoryWithBlob> => {
  const result: CategoryWithBlob = {
    ...category,
    color: randomTagColor(),
    isVideo: false,
  }

  if (category.pin?.imageUrl) {
    try {
      const blob = await storageApi.downloadImage(category.pin.imageUrl)
      result.previewBlobUrl = URL.createObjectURL(blob)
      result.isVideo = blob.type.startsWith('video/') || isVideoUrl(category.pin.imageUrl)
    } catch (error) {
      console.error(`[CategoryGrid] Failed to load preview for ${category.tagName}:`, error)
    }
  }

  return result
}

// Загрузка всех blob'ов
const loadAllBlobs = async () => {
  if (categories.value.length === 0) return

  isLoadingBlobs.value = true
  cleanupBlobs()

  try {
    const results = await Promise.all(categories.value.map(loadCategoryBlob))
    categoriesWithBlobs.value = results
  } catch (error) {
    console.error('[CategoryGrid] Failed to load blobs:', error)
  } finally {
    isLoadingBlobs.value = false
  }
}

// Колонки grid
const gridColumns = computed(() => {
  return `grid-cols-2 md:grid-cols-3 lg:grid-cols-${props.columns}`
})

// Обработка выбора
const handleSelect = (tagName: string) => {
  emit('select', tagName)
}

// Watch categories changes
watch(categories, () => {
  loadAllBlobs()
})

// Lifecycle
onMounted(async () => {
  await fetch(props.limit)
})

onUnmounted(() => {
  cleanupBlobs()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <h2 v-if="showTitle && title" class="text-2xl font-bold text-gray-900">
      {{ title }}
    </h2>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <!-- Error -->
    <EmptyState
      v-else-if="error"
      title="Failed to load categories"
      :message="error.message"
      icon="pi-exclamation-circle"
      action-text="Try Again"
      @action="fetch(limit)"
    />

    <!-- Empty -->
    <EmptyState
      v-else-if="categoriesWithBlobs.length === 0"
      title="No categories yet"
      message="Categories will appear here once pins are tagged"
      icon="pi-tag"
    />

    <!-- Grid -->
    <div v-else :class="['grid gap-4', gridColumns]" v-auto-animate>
      <CategoryCard
        v-for="category in categoriesWithBlobs"
        :key="category.tagId"
        :tag-id="category.tagId"
        :tag-name="category.tagName"
        :preview-url="category.pin?.imageUrl"
        :preview-blob-url="category.previewBlobUrl"
        :is-video="category.isVideo"
        :color="category.color"
        :size="cardSize"
        @click="handleSelect"
      />
    </div>

    <!-- Loading blobs overlay -->
    <div
      v-if="isLoadingBlobs && categoriesWithBlobs.length > 0"
      class="text-center text-gray-500 text-sm"
    >
      Loading previews...
    </div>
  </div>
</template>
