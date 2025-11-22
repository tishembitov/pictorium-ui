<script setup lang="ts">
import { onMounted } from 'vue'
import { useTags } from '@/composables/api/useTags'
import CategoryCard from './CategoryCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Category } from '@/types'

export interface CategoryGridProps {
  /**
   * Количество колонок
   * @default 4
   */
  columns?: number

  /**
   * Лимит категорий
   * @default 20
   */
  limit?: number
}

const props = withDefaults(defineProps<CategoryGridProps>(), {
  columns: 4,
  limit: 20,
})

const emit = defineEmits<{
  (e: 'select', category: Category): void
}>()

const { categories, isLoading, fetchCategories } = useTags()

const handleCategoryClick = (category: Category) => {
  emit('select', category)
}

onMounted(() => {
  fetchCategories(props.limit)
})

const gridColsClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" :class="['grid gap-4', gridColsClass[columns] || 'grid-cols-4']">
      <BaseSkeleton v-for="i in limit" :key="i" variant="rectangular" width="100%" height="300px" />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!isLoading && categories.length === 0"
      title="No Categories Found"
      message="There are no categories available at the moment."
      icon="pi-tag"
      variant="default"
    />

    <!-- Categories Grid -->
    <div v-else :class="['grid gap-4', gridColsClass[columns] || 'grid-cols-4']" v-auto-animate>
      <CategoryCard
        v-for="category in categories"
        :key="category.tagId"
        :category="category"
        @click="handleCategoryClick"
      />
    </div>
  </div>
</template>
