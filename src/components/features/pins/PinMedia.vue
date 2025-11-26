<!-- src/components/features/pin/PinMedia.vue -->
<script setup lang="ts">
import { ref, computed, onActivated, onDeactivated } from 'vue'
import { useVideoPlayer } from '@/composables/features/useVideoPlayer'
import { formatDuration } from '@/utils/formatters'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

export interface PinMediaProps {
  imageSrc?: string | null
  videoSrc?: string | null
  alt?: string
  isGif?: boolean
  height?: number
  rgb?: string
  showPlaceholder?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<PinMediaProps>(), {
  alt: 'Pin image',
  isGif: false,
  showPlaceholder: true,
  autoplay: true,
  loop: true,
  muted: true,
  clickable: true,
})

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error'): void
  (e: 'click'): void
}>()

// Refs
const videoRef = ref<HTMLVideoElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

// State
const isLoaded = ref(false)
const hasError = ref(false)
const showPauseIcon = ref(false)

// Video player composable (только если есть видео)
const videoPlayer = props.videoSrc
  ? useVideoPlayer(videoRef, {
      autoplay: props.autoplay,
      loop: props.loop,
      muted: props.muted,
      volume: 0,
    })
  : null

// Computed
const isVideo = computed(() => !!props.videoSrc)
const isImage = computed(() => !!props.imageSrc && !props.videoSrc)

const formattedTimeRemaining = computed(() => {
  if (!videoPlayer) return ''
  const remaining = Math.max(
    (videoPlayer.duration.value || 0) - (videoPlayer.currentTime.value || 0),
    0,
  )
  return formatDuration(remaining)
})

const placeholderStyle = computed(() => ({
  backgroundColor: props.rgb || '#e5e7eb',
  height: props.height ? `${props.height}px` : '200px',
}))

// Handlers
function onImageLoad() {
  isLoaded.value = true
  emit('load')
}

function onImageError() {
  hasError.value = true
  emit('error')
}

function onVideoLoad() {
  isLoaded.value = true
  emit('load')
}

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}

function handleVideoHover() {
  if (videoPlayer && videoRef.value) {
    videoPlayer.play()
    showPauseIcon.value = false
  }
}

// KeepAlive lifecycle
onActivated(() => {
  if (videoPlayer && videoRef.value) {
    videoPlayer.play()
  }
})

onDeactivated(() => {
  if (videoPlayer) {
    videoPlayer.pause()
  }
})
</script>

<template>
  <div class="relative w-full" @click="handleClick">
    <!-- Placeholder skeleton -->
    <div
      v-if="showPlaceholder && !isLoaded && !hasError"
      class="w-full rounded-3xl"
      :style="placeholderStyle"
    >
      <BaseSkeleton variant="rounded" :height="height || 200" width="100%" animation="pulse" />
    </div>

    <!-- GIF Badge -->
    <div
      v-if="isGif && isLoaded"
      class="absolute top-2 left-2 bg-gray-200 text-black rounded-2xl px-3 py-1 text-sm z-10 font-medium"
    >
      Gif
    </div>

    <!-- Video Duration Badge -->
    <div
      v-if="isVideo && videoPlayer?.duration.value && isLoaded"
      class="absolute top-2 left-2 bg-gray-200 text-black rounded-2xl px-3 py-1 text-sm z-10 font-medium"
    >
      {{ formattedTimeRemaining }}
    </div>

    <!-- Image -->
    <div v-if="isImage" class="relative">
      <img
        ref="imageRef"
        v-show="isLoaded"
        :src="imageSrc!"
        :alt="alt"
        class="w-full h-auto rounded-3xl"
        loading="lazy"
        @load="onImageLoad"
        @error="onImageError"
      />
    </div>

    <!-- Video -->
    <div v-if="isVideo" class="relative" @mouseover="handleVideoHover">
      <video
        ref="videoRef"
        v-show="isLoaded"
        :src="videoSrc!"
        class="w-full h-auto rounded-3xl"
        :autoplay="autoplay"
        :loop="loop"
        :muted="muted"
        playsinline
        @loadeddata="onVideoLoad"
      />

      <!-- Pause indicator (показывается при KeepAlive) -->
      <div
        v-if="showPauseIcon && isLoaded"
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div class="relative flex items-center justify-center w-12 h-12">
          <Transition name="flash">
            <i class="absolute pi pi-play text-5xl text-white glowing-icon" />
          </Transition>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="hasError"
      class="w-full h-48 rounded-3xl bg-gray-200 flex items-center justify-center"
    >
      <i class="pi pi-image text-4xl text-gray-400" />
    </div>
  </div>
</template>

<style scoped>
.flash-enter-active,
.flash-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
  transform: scale(3);
}

.flash-enter-to,
.flash-leave-from {
  opacity: 1;
  transform: scale(1);
}

.glowing-icon {
  text-shadow:
    0 0 15px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 0, 0, 0.6),
    0 0 35px rgba(255, 0, 0, 0.5);
}
</style>
