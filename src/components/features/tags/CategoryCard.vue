<!-- src/components/features/tags/CategoryCard.vue -->
<script setup lang="ts">
/**
 * CategoryCard - Карточка категории с превью пина
 *
 * ✅ ИСПРАВЛЕНО: Удалены неиспользуемые импорты
 */

import { ref, computed } from 'vue'
import { randomTagColor } from '@/utils/colors'

export interface CategoryCardProps {
  /** ID тега */
  tagId: string
  /** Название тега */
  tagName: string
  /** URL превью */
  previewUrl?: string | null
  /** Blob URL превью */
  previewBlobUrl?: string | null
  /** Это видео? */
  isVideo?: boolean
  /** Цвет карточки */
  color?: string
  /** Количество пинов */
  pinsCount?: number
  /** Размер карточки */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<CategoryCardProps>(), {
  previewUrl: null,
  previewBlobUrl: null,
  isVideo: false,
  color: '',
  pinsCount: 0,
  size: 'md',
})

const emit = defineEmits<(e: 'click', tagName: string) => void>()

// Refs
const videoRef = ref<HTMLVideoElement | null>(null)
const isLoaded = ref(false)
const isHovered = ref(false)

// Цвет
const tagColor = computed(() => props.color || randomTagColor())

// URL превью
const displayUrl = computed(() => props.previewBlobUrl || props.previewUrl)

// Fallback
const fallbackImage = 'https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg'

// Размеры
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-40 h-48',
    md: 'w-52 h-64',
    lg: 'w-64 h-80',
  }
  return sizes[props.size]
})

// Обработка загрузки
const handleLoad = () => {
  isLoaded.value = true
}

// Hover эффекты для видео
const handleMouseEnter = () => {
  isHovered.value = true
  if (props.isVideo && videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
  if (props.isVideo && videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = 0
  }
}

// Клик
const handleClick = () => {
  emit('click', props.tagName)
}
</script>

<template>
  <div
    :class="[
      'relative rounded-3xl overflow-hidden cursor-pointer group',
      'transition-all duration-300 transform hover:scale-105 hover:shadow-xl',
      sizeClasses,
    ]"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Skeleton -->
    <div v-if="!isLoaded && displayUrl" class="absolute inset-0 bg-gray-200 animate-pulse" />

    <!-- Изображение -->
    <img
      v-if="!isVideo && displayUrl"
      v-show="isLoaded"
      :src="displayUrl"
      :alt="tagName"
      @load="handleLoad"
      @error="($event.target as HTMLImageElement).src = fallbackImage"
      class="w-full h-full object-cover"
    />

    <!-- Видео -->
    <video
      v-else-if="isVideo && displayUrl"
      v-show="isLoaded"
      ref="videoRef"
      :src="displayUrl"
      @loadeddata="handleLoad"
      class="w-full h-full object-cover"
      muted
      loop
      playsinline
    />

    <!-- Fallback -->
    <img
      v-else-if="!displayUrl"
      :src="fallbackImage"
      :alt="tagName"
      @load="handleLoad"
      class="w-full h-full object-cover"
    />

    <!-- Градиент overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

    <!-- Контент -->
    <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
      <h3 class="font-bold text-lg truncate">{{ tagName }}</h3>
      <p v-if="pinsCount > 0" class="text-sm text-white/80">
        {{ pinsCount.toLocaleString() }} pins
      </p>
    </div>

    <!-- Hover overlay -->
    <div
      :class="[
        'absolute inset-0 bg-black/20 transition-opacity duration-300',
        isHovered ? 'opacity-100' : 'opacity-0',
      ]"
    />
  </div>
</template>
