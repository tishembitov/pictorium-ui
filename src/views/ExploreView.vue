<!-- src/views/ExploreView.vue -->
<script setup lang="ts">
/**
 * ExploreView - Explore с CategoryGrid и TagCloud
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCategories } from '@/composables/api/useTagSearch'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { randomTagColor } from '@/utils/colors'

import AppHeader from '@/components/common/AppHeader.vue'
import CategoryGrid from '@/components/features/tags/CategoryGrid.vue'
import TagCloud from '@/components/features/tags/TagCloud.vue'
import TagSearchInput from '@/components/features/tags/TagSearchInput.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

import type { TagCloudItem } from '@/components/features/tags/TagCloud.vue'
import type { Tag } from '@/types'

const router = useRouter()
const { categories, isLoading } = useCategories()

useDocumentTitle('Explore')

// ============ STATE ============

const searchQuery = ref('')
const selectedTags = ref<string[]>([])

// ============ COMPUTED ============

// Преобразуем категории в TagCloudItem
const cloudTags = computed<TagCloudItem[]>(() => {
  return categories.value.map((cat) => ({
    id: cat.tagId,
    name: cat.tagName,
    count: cat.pinsCount || Math.floor(Math.random() * 100), // fallback
    color: randomTagColor(),
  }))
})

// ============ METHODS ============

function handleCategorySelect(tagName: string) {
  router.push({ path: '/', query: { tag: tagName } })
}

function handleTagCloudSelect(tag: TagCloudItem) {
  router.push({ path: '/', query: { tag: tag.name } })
}

function handleSearchSelect(tag: Tag) {
  router.push({ path: '/', query: { tag: tag.name } })
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <div class="ml-20 mt-20 px-8">
      <h1 class="text-3xl font-bold mb-8">Explore</h1>

      <!-- Search -->
      <div class="max-w-xl mb-10">
        <TagSearchInput
          v-model="searchQuery"
          placeholder="Search categories..."
          :popular-tags="categories.slice(0, 8)"
          show-popular
          @select="handleSearchSelect"
        />
      </div>

      <!-- Tag Cloud -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold mb-4">Trending Tags</h2>

        <div v-if="isLoading" class="flex justify-center py-8">
          <BaseLoader variant="spinner" size="md" />
        </div>

        <TagCloud
          v-else
          :tags="cloudTags"
          :selected-tags="selectedTags"
          :max-tags="30"
          show-count
          @select="handleTagCloudSelect"
        />
      </section>

      <!-- Categories Grid -->
      <section>
        <CategoryGrid
          :limit="24"
          :columns="6"
          card-size="md"
          title="Browse Categories"
          @select="handleCategorySelect"
        />
      </section>
    </div>
  </div>
</template>
