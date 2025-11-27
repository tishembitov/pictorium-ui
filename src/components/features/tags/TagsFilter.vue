<!-- src/components/features/tag/TagsFilter.vue -->
<script setup lang="ts">
/**
 * TagsFilter - Горизонтальный скролл тегов с навигацией
 *
 * Визуальный стиль из старого HomeView.vue:
 * - Фиксированная позиция под header
 * - Градиенты по бокам при hover
 * - Стрелки навигации
 * - Плавный scroll
 */

import { ref, computed, onMounted, watch } from 'vue'
import TagFilterItem from './TagFilterItem.vue'
import type { Category } from '@/types'

export interface TagFilterCategory {
  id: string | number
  name: string
  previewUrl?: string | null
  previewBlobUrl?: string | null
  isVideo?: boolean
  color?: string
}

export interface TagsFilterProps {
  /** Категории/теги */
  categories: TagFilterCategory[]
  /** Выбранный тег */
  selectedTag?: string | null
  /** Показывать "Everything" */
  showEverything?: boolean
  /** Загружаются ли категории */
  loading?: boolean
}

const props = withDefaults(defineProps<TagsFilterProps>(), {
  selectedTag: null,
  showEverything: true,
  loading: false,
})

const emit = defineEmits<{
  (e: 'select', tagName: string): void
  (e: 'tagLoaded'): void
}>()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const loadedCount = ref(0)

// "Everything" тег
const everythingTag: TagFilterCategory = {
  id: 'everything',
  name: 'Everything',
  previewUrl: 'https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg',
  color: 'bg-gray-200',
}

// Все теги включая Everything
const allTags = computed(() => {
  if (props.showEverything) {
    return [everythingTag, ...props.categories]
  }
  return props.categories
})

// Все теги загружены
const allLoaded = computed(() => loadedCount.value >= allTags.value.length)

// Scroll amount
const scrollAmount = 400

// Custom smooth scroll
function customScroll(container: HTMLElement, amount: number, duration = 300) {
  const start = container.scrollLeft
  const startTime = performance.now()

  function ease(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function scrollStep(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeValue = ease(progress)

    container.scrollLeft = start + amount * easeValue

    if (elapsed < duration) {
      requestAnimationFrame(scrollStep)
    }
  }

  requestAnimationFrame(scrollStep)
}

const scrollLeft = () => {
  if (containerRef.value) {
    customScroll(containerRef.value, -scrollAmount)
  }
}

const scrollRight = () => {
  if (containerRef.value) {
    customScroll(containerRef.value, scrollAmount)
  }
}

// Обработка загрузки тега
const handleTagLoaded = () => {
  loadedCount.value++
  emit('tagLoaded')
}

// Выбор тега
const handleSelect = (name: string) => {
  emit('select', name)
}

// Проверка выбранности
const isSelected = (name: string) => {
  if (name === 'Everything') {
    return props.selectedTag === null || props.selectedTag === 'Everything'
  }
  return props.selectedTag === name
}
</script>

<template>
  <div class="group relative">
    <!-- Левая стрелка -->
    <button
      type="button"
      @click="scrollLeft"
      class="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white rounded-full px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 active:scale-75"
      aria-label="Scroll left"
    >
      <i class="pi pi-chevron-left text-xl" />
    </button>

    <!-- Контейнер с градиентами -->
    <div class="relative overflow-hidden">
      <!-- Градиент слева -->
      <div
        class="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      <!-- Градиент справа -->
      <div
        class="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      <!-- Скролл контейнер -->
      <div
        ref="containerRef"
        class="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide p-0.5 px-5"
        v-auto-animate
      >
        <!-- Loading skeletons -->
        <template v-if="loading">
          <div
            v-for="i in 8"
            :key="`skeleton-${i}`"
            class="flex items-center gap-1 rounded-full bg-gray-100 animate-pulse pl-2 pr-5 py-1"
          >
            <div class="w-9 h-9 rounded-full bg-gray-200" />
            <div class="w-16 h-4 rounded bg-gray-200" />
          </div>
        </template>

        <!-- Теги -->
        <template v-else>
          <TagFilterItem
            v-for="tag in allTags"
            :key="tag.id"
            :id="tag.id"
            :name="tag.name"
            :preview-url="tag.previewUrl"
            :preview-blob-url="tag.previewBlobUrl"
            :is-video="tag.isVideo"
            :color="tag.color"
            :selected="isSelected(tag.name)"
            :loading="!allLoaded"
            @click="handleSelect"
            @loaded="handleTagLoaded"
          />
        </template>
      </div>
    </div>

    <!-- Правая стрелка -->
    <button
      type="button"
      @click="scrollRight"
      class="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white rounded-full px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 active:scale-75"
      aria-label="Scroll right"
    >
      <i class="pi pi-chevron-right text-xl" />
    </button>
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
