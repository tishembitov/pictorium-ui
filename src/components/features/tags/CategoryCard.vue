<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storageApi } from '@/api/storage.api'
import type { Category } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'

export interface CategoryCardProps {
  category: Category
}

const props = defineProps<CategoryCardProps>()

const emit = defineEmits<{
  (e: 'click', category: Category): void
}>()

const mediaUrl = ref<string | null>(null)
const isLoaded = ref(false)
const isImage = ref(false)
const isVideo = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)

const loadMedia = async () => {
  try {
    if (props.category.pin.imageUrl) {
      const blob = await storageApi.downloadImage(props.category.pin.imageUrl)
      mediaUrl.value = URL.createObjectURL(blob)
      isImage.value = true
    } else if (props.category.pin.videoPreviewUrl) {
      const blob = await storageApi.downloadImage(props.category.pin.videoPreviewUrl)
      mediaUrl.value = URL.createObjectURL(blob)
      isVideo.value = true
    }
    isLoaded.value = true
  } catch (error) {
    console.error('[CategoryCard] Failed to load media:', error)
    // Fallback image
    mediaUrl.value = 'https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg'
    isImage.value = true
    isLoaded.value = true
  }
}

const handleMouseEnter = () => {
  if (isVideo.value && videoRef.value) {
    videoRef.value.play()
  }
}

const handleClick = () => {
  emit('click', props.category)
}

onMounted(() => {
  loadMedia()
})
</script>

<template>
  <BaseCard
    padding="none"
    shadow="md"
    rounded="3xl"
    :hoverable="true"
    @click="handleClick"
    class="overflow-hidden cursor-pointer group"
  >
    <!-- Media Container -->
    <div class="relative aspect-square overflow-hidden">
      <!-- Loading Skeleton -->
      <div v-show="!isLoaded" class="absolute inset-0 bg-gray-200 animate-pulse" />

      <!-- Image -->
      <img
        v-if="isLoaded && isImage && mediaUrl"
        :src="mediaUrl"
        :alt="category.tagName"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />

      <!-- Video -->
      <video
        v-if="isLoaded && isVideo && mediaUrl"
        ref="videoRef"
        :src="mediaUrl"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        @mouseenter="handleMouseEnter"
        autoplay
        loop
        muted
      />

      <!-- Overlay with Tag Name -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <h3 class="text-white text-xl font-bold text-center">
          {{ category.tagName }}
        </h3>
      </div>
    </div>
  </BaseCard>
</template>
