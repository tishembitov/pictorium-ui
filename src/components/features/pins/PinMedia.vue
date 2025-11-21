<script setup lang="ts">
import { ref, computed, onActivated, onDeactivated } from 'vue'
import { storageApi } from '@/api/storage.api'
import { isImage, isVideo, isGif } from '@/utils/media'
import { formatDuration } from '@/utils/formatters'
import type { Pin } from '@/types'

export interface PinMediaProps {
  pin: Pin
  autoPlay?: boolean
  showControls?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<PinMediaProps>(), {
  autoPlay: true,
  showControls: true,
  rounded: true,
})

const emit = defineEmits<{
  (e: 'loaded'): void
  (e: 'error'): void
}>()

// State
const mediaBlobUrl = ref<string | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const showPauseOverlay = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// Computed
const isImageMedia = computed(() => {
  if (props.pin.videoPreviewUrl) return false
  return true
})

const isVideoMedia = computed(() => !!props.pin.videoPreviewUrl)

const isGifMedia = computed(() => {
  return mediaBlobUrl.value && props.pin.contentType === 'image/gif'
})

const formattedTimeRemaining = computed(() => {
  const remaining = Math.max(duration.value - currentTime.value, 0)
  return formatDuration(remaining)
})

// Methods
const loadMedia = async () => {
  try {
    const mediaId = props.pin.videoPreviewUrl || props.pin.imageUrl

    if (!mediaId) {
      // Fallback image
      mediaBlobUrl.value = 'https://i.pinimg.com/736x/6c/a8/05/6ca805efcc51ff2366298781aecde4ae.jpg'
      emit('loaded')
      return
    }

    const blob = await storageApi.downloadImage(mediaId)
    mediaBlobUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('[PinMedia] Load failed:', error)
    // Fallback
    mediaBlobUrl.value = 'https://i.pinimg.com/736x/6c/a8/05/6ca805efcc51ff2366298781aecde4ae.jpg'
    emit('error')
  }
}

const handleImageLoad = () => {
  emit('loaded')
}

const handleVideoLoad = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  }
  emit('loaded')
}

const handleTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const handleVideoHover = () => {
  if (videoRef.value && props.autoPlay) {
    videoRef.value.play()
    showPauseOverlay.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadMedia()
})

onActivated(() => {
  if (videoRef.value && props.autoPlay) {
    videoRef.value.play()
    showPauseOverlay.value = false
  }
})

onDeactivated(() => {
  if (videoRef.value) {
    videoRef.value.pause()
    showPauseOverlay.value = true
  }
})

onBeforeUnmount(() => {
  if (mediaBlobUrl.value && mediaBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(mediaBlobUrl.value)
  }
})
</script>

<template>
  <div class="relative">
    <!-- GIF Badge -->
    <div
      v-if="isGifMedia"
      class="absolute top-2 left-2 bg-gray-100 text-black rounded-2xl px-3 py-1 text-sm z-10"
    >
      Gif
    </div>

    <!-- Video Duration Badge -->
    <div
      v-if="isVideoMedia && duration"
      class="absolute top-2 left-2 bg-gray-100 text-black rounded-2xl px-3 py-1 text-sm z-10"
    >
      {{ formattedTimeRemaining }}
    </div>

    <!-- Image -->
    <img
      v-if="isImageMedia && mediaBlobUrl"
      :src="mediaBlobUrl"
      :alt="pin.title || 'Pin image'"
      :class="['w-full h-auto object-cover', rounded && 'rounded-3xl']"
      @load="handleImageLoad"
      loading="lazy"
    />

    <!-- Video -->
    <div v-if="isVideoMedia && mediaBlobUrl" class="relative">
      <video
        ref="videoRef"
        :src="mediaBlobUrl"
        :class="['w-full h-auto object-cover', rounded && 'rounded-3xl']"
        @loadeddata="handleVideoLoad"
        @timeupdate="handleTimeUpdate"
        @mouseenter="handleVideoHover"
        autoplay
        loop
        muted
      />

      <!-- Play/Pause Overlay -->
      <div
        v-if="showPauseOverlay && showControls"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <Transition name="flash2">
          <i v-if="showPauseOverlay" class="pi pi-play text-5xl text-white glowing-icon"></i>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glowing-icon {
  text-shadow:
    0 0 15px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 0, 0, 0.6),
    0 0 35px rgba(255, 0, 0, 0.5);
}

.flash2-enter-active,
.flash2-leave-active {
  transition:
    opacity 0.5s ease-out,
    transform 0.5s cubic-bezier(0.3, 0.8, 0.2, 1);
}

.flash2-enter-from,
.flash2-leave-to {
  opacity: 0;
  transform: scale(3);
}
</style>
