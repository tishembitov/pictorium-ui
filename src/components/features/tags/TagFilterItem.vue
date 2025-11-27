<!-- src/components/features/tag/TagFilterItem.vue -->
<script setup lang="ts">
/**
 * TagFilterItem - Один тег в горизонтальном фильтре
 *
 * Визуальный стиль из старого HomeView.vue:
 * - Круглое превью изображения/видео слева
 * - Название тега справа
 * - При выборе: черный фон, белый текст, scale-105
 * - Hover: scale-110
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { randomTagColor } from '@/utils/colors'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

export interface TagFilterItemProps {
  /** ID тега */
  id: string | number
  /** Название тега */
  name: string
  /** URL превью изображения */
  previewUrl?: string | null
  /** URL blob превью */
  previewBlobUrl?: string | null
  /** Это видео? */
  isVideo?: boolean
  /** Цвет фона */
  color?: string
  /** Выбран ли */
  selected?: boolean
  /** Загружается ли */
  loading?: boolean
}

const props = withDefaults(defineProps<TagFilterItemProps>(), {
  previewUrl: null,
  previewBlobUrl: null,
  isVideo: false,
  color: '',
  selected: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'click', name: string): void
  (e: 'loaded'): void
}>()

// Refs
const videoRef = ref<HTMLVideoElement | null>(null)
const isLoaded = ref(false)

// Цвет тега
const tagColor = computed(() => props.color || randomTagColor())

// URL превью (приоритет blob над обычным URL)
const displayUrl = computed(() => props.previewBlobUrl || props.previewUrl)

// Fallback изображение
const fallbackImage = 'https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg'

// Обработка загрузки
const handleLoad = () => {
  isLoaded.value = true
  emit('loaded')
}

// Hover для видео
const handleMouseEnter = () => {
  if (props.isVideo && videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
}

const handleMouseLeave = () => {
  if (props.isVideo && videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = 0
  }
}

// Классы контейнера
const containerClasses = computed(() => [
  'flex items-center gap-1 rounded-full cursor-pointer',
  'transition-all duration-100 transform',
  'pl-2 pr-5 py-1',
  props.selected ? 'bg-black text-white shadow-lg scale-105' : tagColor.value,
  !props.selected && 'hover:scale-110',
])
</script>

<template>
  <div
    :class="containerClasses"
    @click="emit('click', name)"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Превью (круглое) -->
    <div class="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
      <!-- Skeleton при загрузке -->
      <div
        v-if="loading || (!isLoaded && displayUrl)"
        class="w-full h-full bg-gray-200 animate-pulse rounded-full"
      />

      <!-- Изображение -->
      <img
        v-if="!isVideo && displayUrl"
        v-show="isLoaded"
        :src="displayUrl"
        :alt="name"
        @load="handleLoad"
        @error="($event.target as HTMLImageElement).src = fallbackImage"
        class="w-full h-full object-cover rounded-full"
        :class="{ 'fade-in-animation': isLoaded }"
        loading="lazy"
      />

      <!-- Видео -->
      <video
        v-else-if="isVideo && displayUrl"
        v-show="isLoaded"
        ref="videoRef"
        :src="displayUrl"
        @loadeddata="handleLoad"
        class="w-full h-full object-cover rounded-full"
        :class="{ 'fade-in-animation': isLoaded }"
        muted
        loop
        playsinline
      />

      <!-- Fallback если нет превью -->
      <img
        v-else-if="!displayUrl"
        :src="fallbackImage"
        :alt="name"
        @load="handleLoad"
        class="w-full h-full object-cover rounded-full"
      />
    </div>

    <!-- Название тега -->
    <span class="text-sm truncate max-w-[120px]">{{ name }}</span>
  </div>
</template>

<style scoped>
.fade-in-animation {
  opacity: 0;
  transform: scale(0.95);
  animation: fadeIn 0.3s ease-in-out forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
