<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, type Ref } from 'vue'
import { useTags } from '@/composables/api/useTags'
import { useEventListener, useWindowSize } from '@/composables/utils'
import TagFilterItem from './TagFilterItem.vue'
import type { Category } from '@/types'
import { smoothScrollHorizontal } from '@/utils/scroll'

export interface TagsFilterProps {
  /**
   * Показывать "Everything" тег
   * @default true
   */
  showAll?: boolean

  /**
   * Выбранный тег
   */
  selectedTag?: string | null

  /**
   * Лимит категорий
   * @default 20
   */
  limit?: number

  /**
   * Показывать стрелки
   * @default true
   */
  showArrows?: boolean
}

const props = withDefaults(defineProps<TagsFilterProps>(), {
  showAll: true,
  selectedTag: null,
  limit: 20,
  showArrows: true,
})

const emit = defineEmits<{
  (e: 'select', tagName: string): void
}>()

const { categories, isLoading, fetchCategories } = useTags()

const containerRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const allTags = computed(() => {
  const tags: Category[] = []

  if (props.showAll) {
    tags.push({
      tagId: 'all',
      tagName: 'Everything',
      pin: {
        id: 'all',
        imageUrl: 'https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg',
        videoPreviewUrl: null,
      },
    })
  }

  return [...tags, ...categories.value]
})

const updateScrollState = () => {
  if (!containerRef.value) return

  const { scrollLeft, scrollWidth, clientWidth } = containerRef.value
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
}

const scrollLeft = () => {
  if (containerRef.value) {
    smoothScrollHorizontal(containerRef.value, -400, 300)
  }
}

const scrollRight = () => {
  if (containerRef.value) {
    smoothScrollHorizontal(containerRef.value, 400, 300)
  }
}

const handleSelect = (tagName: string) => {
  emit('select', tagName)
}

onMounted(async () => {
  await fetchCategories(props.limit)
  await nextTick()
  updateScrollState()
})

// Watch for scroll events
watch(containerRef, (container) => {
  if (!container) return

  useEventListener(container, 'scroll', updateScrollState)
})

// Watch for window resize
const { width: windowWidth } = useWindowSize()
watch(windowWidth, () => {
  updateScrollState()
})
</script>

<template>
  <div class="group relative">
    <!-- Left Arrow -->
    <button
      v-if="showArrows && canScrollLeft"
      @click="scrollLeft"
      class="absolute left-5 top-1/2 transform -translate-y-1/2 z-20 bg-white rounded-full px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg active:scale-75"
      aria-label="Scroll left"
    >
      <i class="pi pi-chevron-left text-xl"></i>
    </button>

    <!-- Tags Container -->
    <div class="relative overflow-hidden">
      <!-- Left Gradient -->
      <div
        v-if="showArrows"
        class="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      <!-- Right Gradient -->
      <div
        v-if="showArrows"
        class="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      <!-- Tags Scroll Container -->
      <div
        ref="containerRef"
        class="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide p-0.5 px-5"
        v-auto-animate
      >
        <TagFilterItem
          v-for="category in allTags"
          :key="category.tagId"
          :tag-name="category.tagName"
          :pin="category.pin"
          :selected="selectedTag === category.tagName"
          @select="handleSelect"
        />
      </div>
    </div>

    <!-- Right Arrow -->
    <button
      v-if="showArrows && canScrollRight"
      @click="scrollRight"
      class="absolute right-5 top-1/2 transform -translate-y-1/2 z-20 bg-white rounded-full px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg active:scale-75"
      aria-label="Scroll right"
    >
      <i class="pi pi-chevron-right text-xl"></i>
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
