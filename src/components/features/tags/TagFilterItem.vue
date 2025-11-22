<script setup lang="ts">
import { ref, computed } from 'vue'
import { storageApi } from '@/api/storage.api'
import { isImage, isVideo } from '@/utils/media'
import type { PinPreview } from '@/types'
import { randomTagColor } from '@/utils/colors'

export interface TagFilterItemProps {
  tagName: string
  pin: PinPreview
  selected?: boolean
}

const props = withDefaults(defineProps<TagFilterItemProps>(), {
  selected: false,
})

const emit = defineEmits<{
  (e: 'select', tagName: string): void
}>()

const isLoaded = ref(false)
const mediaUrl = ref<string | null>(null)
const isImageMedia = ref(false)
const isVideoMedia = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)

const bgColor = computed(() => {
  return randomTagColor()
})

const loadMedia = async () => {
  try {
    if (props.pin.imageUrl) {
      const blob = await storageApi.downloadImage(props.pin.imageUrl)
      mediaUrl.value = URL.createObjectURL(blob)
      isImageMedia.value = true
      isVideoMedia.value = false
    } else if (props.pin.videoPreviewUrl) {
      const blob = await storageApi.downloadImage(props.pin.videoPreviewUrl)
      mediaUrl.value = URL.createObjectURL(blob)
      isImageMedia.value = false
      isVideoMedia.value = true
    }
    isLoaded.value = true
  } catch (error) {
    console.error('[TagFilterItem] Failed to load media:', error)
    isLoaded.value = true
  }
}

const handleMouseEnter = () => {
  if (isVideoMedia.value && videoRef.value) {
    videoRef.value.play()
  }
}

const handleClick = () => {
  emit('select', props.tagName)
}

loadMedia()
</script>

<template>
  <div
    @click="handleClick"
    :class="[
      'flex items-center gap-1 text-sm rounded-3xl pl-2 pr-5 py-1 cursor-pointer transition-all duration-200',
      selected ? 'bg-black text-white shadow-lg scale-105' : bgColor,
      'hover:scale-110 transform',
    ]"
  >
    <!-- Media Preview -->
    <div class="w-9 h-9 flex-shrink-0 relative">
      <!-- Loading Skeleton -->
      <div v-show="!isLoaded" class="bg-gray-100 w-full h-full rounded-full animate-pulse" />

      <!-- Image -->
      <img
        v-if="isLoaded && isImageMedia && mediaUrl"
        :src="mediaUrl"
        :alt="tagName"
        class="w-full h-full object-cover rounded-full fade-in"
      />

      <!-- Video -->
      <video
        v-if="isLoaded && isVideoMedia && mediaUrl"
        ref="videoRef"
        :src="mediaUrl"
        class="w-full h-full object-cover rounded-full fade-in"
        @mouseenter="handleMouseEnter"
        autoplay
        loop
        muted
      />
    </div>

    <!-- Tag Name -->
    <span class="truncate">{{ tagName }}</span>
  </div>
</template>

<style scoped>
.fade-in {
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
